/**
 * Comprehensive tests for RoomsService covering:
 * - Room creation (C-5 code uniqueness), M-8 (session upsert), M-3 (deleteRoom),
 *   (pagination), H-6 (isArchived filter), M-6 (archive cascade).
 */
import test, { mock } from "node:test";
import assert from "node:assert/strict";

import Room from "../src/models/room.model.js";
import Session from "../src/models/session.model.js";
import { AppError } from "../src/middleware/error.middleware.js";
import { RoomsService } from "../src/modules/rooms/rooms.service.js";

// Minimal collaborationService stub so getRoom doesn't fail on ensureRoomLoaded
import collaborationService from "../src/services/collaboration.service.js";

test.afterEach(() => {
  mock.restoreAll();
});

// createRoom : bounded code retries

test("RoomsService.createRoom generates a unique room code with bounded retries", async () => {
  let callCount = 0;
  // First two findOne calls simulate collisions; third returns null (code is free)
  mock.method(Room, "findOne", async () => {
    callCount++;
    if (callCount <= 2) return { _id: "existing" }; // collision — truthy
    return null;                                      // free slot
  });

  mock.method(Room, "create", async (data) => ({
    _id: "new-room-id",
    ...data,
    save: async () => {}
  }));

  mock.method(Session, "findOneAndUpdate", async () => ({
    _id: "session-1",
    roomId: "new-room-id",
    status: "active",
    version: 1
  }));

  const result = await RoomsService.createRoom({
    name: "Test Room",
    ownerId: "owner-1"
  });

  assert.ok(result.room);
  assert.ok(result.session);
  // The first findOne(code) returned truthy (collision), second too, third returned null
  // plus one findOne(code) call succeeded → total ≥ 3
  assert.ok(callCount >= 3, "Should have retried code generation on collision");
});

test("RoomsService.createRoom throws after exhausting code retries", async () => {
  // All findOne calls simulate collisions — every code candidate is taken
  mock.method(Room, "findOne", async () => ({ _id: "existing" }));

  await assert.rejects(
    () => RoomsService.createRoom({ name: "Doomed Room", ownerId: "owner-1" }),
    (err) => {
      assert.ok(err instanceof AppError, `Expected AppError, got: ${err.constructor.name}: ${err.message}`);
      assert.equal(err.code, "ROOM_CODE_EXHAUSTED");
      return true;
    }
  );
});

// listRooms : pagination

test("RoomsService.listRooms applies pagination and returns metadata", async () => {
  const fakeRooms = [{ _id: "r1", name: "Room 1" }];
  const chainable = {
    populate: () => chainable,
    sort: () => chainable,
    skip: (n) => { assert.ok(n >= 0); return chainable; },
    limit: (n) => { assert.ok(n > 0 && n <= 100); return chainable; },
    then: (resolve) => resolve(fakeRooms)
  };

  mock.method(Room, "find", () => chainable);
  mock.method(Room, "countDocuments", async () => 25);

  const result = await RoomsService.listRooms("user-1", 1, 10);

  assert.ok(Array.isArray(result.rooms));
  assert.equal(result.pagination.total, 25);
  assert.equal(result.pagination.limit, 10);
  assert.equal(result.pagination.pages, 3);
});

test("RoomsService.listRooms clamps limit to 100 max", async () => {
  let capturedLimit = null;
  const chainable = {
    populate: () => chainable,
    sort: () => chainable,
    skip: () => chainable,
    limit: (n) => { capturedLimit = n; return chainable; },
    then: (resolve) => resolve([])
  };
  mock.method(Room, "find", () => chainable);
  mock.method(Room, "countDocuments", async () => 0);

  await RoomsService.listRooms("user-1", 1, 999); // Try to request 999
  assert.equal(capturedLimit, 100, "Limit should be clamped to 100");
});


// getRoom : isArchived filter on ObjectId path

test("RoomsService.getRoom uses isArchived filter on ObjectId path", async () => {
  let filterUsed = null;
  mock.method(Room, "findOne", async (filter) => {
    filterUsed = filter;
    return null; // Simulate not found
  });

  await assert.rejects(
    () => RoomsService.getRoom("507f1f77bcf86cd799439011", "user-1"),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, "ROOM_NOT_FOUND");
      // H-6: verify the isArchived filter is present in the ObjectId lookup
      assert.equal(filterUsed?.isArchived, false);
      return true;
    }
  );
});

// deleteRoom : soft-delete, M-6: socket eviction

test("RoomsService.deleteRoom archives the room (owner only)", async () => {
  let savedRoom = null;
  const fakeRoom = {
    _id: "room-1",
    ownerId: { toString: () => "owner-1" },
    isArchived: false,
    save: async function () { savedRoom = this; }
  };
  mock.method(Room, "findById", async () => fakeRoom);

  const result = await RoomsService.deleteRoom("room-1", "owner-1", null);

  assert.equal(savedRoom.isArchived, true);
  assert.ok(result.message.includes("archived"));
});

test("RoomsService.deleteRoom rejects non-owners", async () => {
  const fakeRoom = {
    _id: "room-1",
    ownerId: { toString: () => "owner-1" },
    isArchived: false
  };
  mock.method(Room, "findById", async () => fakeRoom);

  await assert.rejects(
    () => RoomsService.deleteRoom("room-1", "intruder-user", null),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, "FORBIDDEN");
      return true;
    }
  );
});

test("RoomsService.deleteRoom emits room:archived to active sockets", async () => {
  const fakeRoom = {
    _id: "room-1",
    ownerId: { toString: () => "owner-1" },
    isArchived: false,
    save: async () => {}
  };
  mock.method(Room, "findById", async () => fakeRoom);

  const emitted = [];
  const fakeSockets = [{ leave: () => {} }, { leave: () => {} }];
  const fakeIo = {
    to: () => ({
      emit: (event, data) => emitted.push({ event, data }),
      fetchSockets: async () => fakeSockets
    }),
    in: () => ({ fetchSockets: async () => fakeSockets })
  };

  await RoomsService.deleteRoom("room-1", "owner-1", fakeIo);

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].event, "room:archived");
});

// getRoom : session upsert

test("RoomsService.getRoom uses findOneAndUpdate upsert for session creation", async () => {
  const fakeRoom = {
    _id: "room-2",
    ownerId: { toString: () => "owner-2" },
    visibility: "public",
    isArchived: false,
    members: [{ userId: { toString: () => "owner-2" }, role: "owner" }]
  };
  mock.method(Room, "findOne", async () => fakeRoom);

  let upsertCallArgs = null;
  mock.method(Session, "findOneAndUpdate", async (...args) => {
    upsertCallArgs = args;
    return { _id: "sess-1", roomId: "room-2", status: "active", version: 1 };
  });

  // Stub out the collaboration service calls
  mock.method(collaborationService, "ensureRoomLoaded", async () => {});
  mock.method(collaborationService, "getSnapshot", () => ({ elements: [], presence: [], version: 1 }));

  await RoomsService.getRoom("room-2", "owner-2");

  assert.ok(upsertCallArgs, "findOneAndUpdate should have been called");
  const [filter, update, opts] = upsertCallArgs;
  assert.equal(filter.status, "active");
  assert.equal(opts.upsert, true);
});
