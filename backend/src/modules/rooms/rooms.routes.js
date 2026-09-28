import { Router } from "express";
import RoomsController from "./rooms.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

const router = Router();

const createRoomSchema = {
  body: {
    name: {
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100
    },
    description: {
      type: "string",
      maxLength: 500
    },
    visibility: {
      enum: ["public", "private"]
    }
  }
};

// All room routes require authentication 
router.use(authenticate);

router.post("/", validate(createRoomSchema), RoomsController.createRoom);
router.get("/", RoomsController.listRooms);
router.get("/:id", RoomsController.getRoom);
router.post("/:id/join", RoomsController.joinRoom);
router.patch("/:id", RoomsController.updateRoom);
router.delete("/:id", RoomsController.deleteRoom); // M-3: soft-delete (owner only)
router.post("/:id/export", RoomsController.exportRoom);
router.post("/:id/sync", RoomsController.syncOffline);

export default router;
