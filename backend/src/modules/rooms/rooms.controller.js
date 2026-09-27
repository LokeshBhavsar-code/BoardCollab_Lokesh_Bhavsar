import RoomsService from "./rooms.service.js";

export class RoomsController {
  static async createRoom(req, res, next) {
    try {
      const { name, description, visibility } = req.body;
      const result = await RoomsService.createRoom({
        name,
        description,
        visibility,
        ownerId: req.user.id
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async listRooms(req, res, next) {
    try {
      // H-3: Accept pagination params from query string
      const { page = 1, limit = 50 } = req.query;
      const result = await RoomsService.listRooms(req.user.id, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getRoom(req, res, next) {
    try {
      const { id } = req.params;
      const result = await RoomsService.getRoom(id, req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async joinRoom(req, res, next) {
    try {
      const { id } = req.params;
      const room = await RoomsService.joinRoom(id, req.user.id);
      res.status(200).json({ message: "Successfully joined room", room });
    } catch (err) {
      next(err);
    }
  }

  static async updateRoom(req, res, next) {
    try {
      const { id } = req.params;
      const room = await RoomsService.updateRoom(id, req.user.id, req.body);
      res.status(200).json({ room });
    } catch (err) {
      next(err);
    }
  }

  // M-3: DELETE endpoint — soft-deletes (archives) the room
  static async deleteRoom(req, res, next) {
    try {
      const { id } = req.params;
      // Pass the io instance from app locals so active sockets are notified (M-6)
      const io = req.app.get("io");
      const result = await RoomsService.deleteRoom(id, req.user.id, io);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async exportRoom(req, res, next) {
    try {
      const { id } = req.params;
      const format = (req.query.format || "json").toLowerCase();
      const exportData = await RoomsService.exportRoom(id, req.user.id, format);

      res.setHeader("Content-Type", exportData.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${exportData.filename}"`);

      // PNG and other binary formats — send raw buffer
      if (Buffer.isBuffer(exportData.data)) {
        return res.send(exportData.data);
      }
      if (typeof exportData.data === "string") {
        return res.send(exportData.data);
      }
      return res.json(exportData.data);
    } catch (err) {
      next(err);
    }
  }

  static async syncOffline(req, res, next) {
    try {
      const { id } = req.params;
      const { operations, clientBaseVersion } = req.body;
      const result = await RoomsService.syncOfflineBatch(
        id,
        req.user.id,
        operations || [],
        clientBaseVersion || 0
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default RoomsController;
