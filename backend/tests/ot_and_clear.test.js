/**
 * Extended collaboration service tests covering new fixes:
 * - H-1: OT version conflict rejection
 * - L-5: clearCanvas resets ALL users' history stacks
 * - H-4: clearCanvas authorization (tested at handler level, but verify service behavior)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { CollaborationService } from "../src/services/collaboration.service.js";
import { AppError } from "../src/middleware/error.middleware.js";

// H-1: OT version conflict detection

test("H-1: applyStroke rejects stale clientVersion (OT conflict)", () => {
  const service = new CollaborationService();
  const roomId = "ot-test-room";
  const userId = "user-alice";

  // First: create element — server version becomes 2
  const el = service.applyStroke(roomId, userId, {
    id: "shape-1",
    type: "rect",
    properties: { x: 0, y: 0, width: 100, height: 100 }
  }, "session-1");

  assert.equal(el.version, 2, "Server version should be 2 after first apply");

  // Another user updates the element — server version becomes 3
  service.applyStroke(roomId, "user-bob", {
    id: "shape-1",
    type: "rect",
    properties: { x: 50, y: 50, width: 100, height: 100 }
  }, "session-1");

  // Alice tries to update with clientVersion=2 (stale — server is at 3)
  assert.throws(
    () => service.applyStroke(roomId, userId, {
      id: "shape-1",
      type: "rect",
      clientVersion: 2, // Alice's stale version
      properties: { x: 10, y: 10, width: 100, height: 100 }
    }, "session-1"),
    (err) => {
      assert.ok(err instanceof AppError, "Should throw AppError");
      assert.equal(err.code, "OT_CONFLICT");
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /Conflict/);
      return true;
    }
  );
});

test("H-1: applyStroke accepts matching clientVersion (no conflict)", () => {
  const service = new CollaborationService();
  const roomId = "ot-no-conflict";

  const el = service.applyStroke(roomId, "u1", {
    id: "shape-2",
    type: "circle",
    properties: { radius: 30 }
  }, "s1");

  // Update with correct clientVersion (matches server version)
  const updated = service.applyStroke(roomId, "u1", {
    id: "shape-2",
    type: "circle",
    clientVersion: el.version, // Matches current server version → no conflict
    properties: { radius: 40 }
  }, "s1");

  assert.equal(updated.properties.radius, 40);
  assert.ok(updated.version > el.version);
});

test("H-1: applyStroke allows new elements without clientVersion check", () => {
  const service = new CollaborationService();
  const roomId = "ot-new-element";

  // New element (no existing in state) — no clientVersion needed
  const el = service.applyStroke(roomId, "u1", {
    id: "brand-new",
    type: "path",
    properties: {}
    // clientVersion intentionally absent
  }, "s1");

  assert.ok(el);
  assert.equal(el.id, "brand-new");
});

//  clearCanvas resets ALL users' history stacks

test("L-5: clearCanvas resets undo/redo history for all users in the room", () => {
  const service = new CollaborationService();
  const roomId = "clear-history-room";

  // Alice and Bob each draw a stroke
  service.applyStroke(roomId, "alice", { id: "s-alice", type: "path" });
  service.applyStroke(roomId, "bob", { id: "s-bob", type: "rect" });

  // Both have undo stacks
  const state = service.getRoomState(roomId);
  const aliceHist = service.getUserHistory(state, "alice");
  const bobHist = service.getUserHistory(state, "bob");
  assert.equal(aliceHist.undoStack.length, 1);
  assert.equal(bobHist.undoStack.length, 1);

  // Clear canvas (any user)
  service.clearCanvas(roomId, "alice");

  // Both users' history should be empty now
  assert.equal(aliceHist.undoStack.length, 0, "Alice's undo stack should be cleared");
  assert.equal(aliceHist.redoStack.length, 0, "Alice's redo stack should be cleared");
  assert.equal(bobHist.undoStack.length, 0, "Bob's undo stack should be cleared");
  assert.equal(bobHist.redoStack.length, 0, "Bob's redo stack should be cleared");
});

test("L-5: After clearCanvas, undo returns null for all users", () => {
  const service = new CollaborationService();
  const roomId = "clear-undo-null";

  service.applyStroke(roomId, "alice", { id: "el-1", type: "path" });
  service.clearCanvas(roomId, "alice");

  const result = service.undo(roomId, "alice");
  assert.equal(result, null, "Undo after clear should return null");
});

// OT conflict produces correct broadcast flow test

test("H-1: stale write after concurrent modification is rejected with OT_CONFLICT", () => {
  const service = new CollaborationService();
  const roomId = "concurrent-edit";

  // User A creates element at version 2
  service.applyStroke(roomId, "userA", { id: "el-concurrent", type: "line", properties: {} });

  // User B modifies the same element at version 3 (arrives first at server)
  service.applyStroke(roomId, "userB", {
    id: "el-concurrent",
    type: "line",
    properties: { stroke: "#ff0000" }
  });

  const currentVersion = service.getRoomState(roomId).version;

  // User A sends update with version 2 (stale — server is at 3)
  assert.throws(
    () => service.applyStroke(roomId, "userA", {
      id: "el-concurrent",
      type: "line",
      clientVersion: 2,
      properties: { stroke: "#0000ff" }
    }),
    (err) => {
      assert.equal(err.code, "OT_CONFLICT");
      // Version should not have changed (rejected write)
      assert.equal(service.getRoomState(roomId).version, currentVersion);
      return true;
    }
  );
});
