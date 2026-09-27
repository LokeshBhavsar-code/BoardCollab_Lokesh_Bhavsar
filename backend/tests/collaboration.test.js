import test from "node:test";
import assert from "node:assert/strict";
import { CollaborationService } from "../src/services/collaboration.service.js";

test("CollaborationService applies strokes and updates version", () => {
  const service = new CollaborationService();
  const roomId = "test-room-1";
  const userId = "user-123";

  const stroke = {
    id: "el-1",
    type: "path",
    properties: {
      points: [[0, 0], [10, 10]],
      stroke: "#ff0000",
      strokeWidth: 3
    }
  };

  const result = service.applyStroke(roomId, userId, stroke, "session-1");
  assert.equal(result.id, "el-1");
  assert.equal(result.type, "path");
  assert.equal(result.createdBy, userId);
  assert.equal(result.version, 2);

  const snapshot = service.getSnapshot(roomId);
  assert.equal(snapshot.elements.length, 1);
  assert.equal(snapshot.elements[0].id, "el-1");
});

test("CollaborationService supports user-scoped undo and redo", () => {
  const service = new CollaborationService();
  const roomId = "test-room-undo";
  const user1 = "user-alice";
  const user2 = "user-bob";

  // Alice draws stroke 1
  service.applyStroke(roomId, user1, { id: "stroke-alice-1", type: "path", properties: {} });
  // Bob draws stroke 2
  service.applyStroke(roomId, user2, { id: "stroke-bob-1", type: "path", properties: {} });

  // Snapshot has 2 elements
  let snapshot = service.getSnapshot(roomId);
  assert.equal(snapshot.elements.length, 2);

  // Alice undos her stroke
  const undoneElement = service.undo(roomId, user1);
  assert.ok(undoneElement);
  assert.equal(undoneElement.id, "stroke-alice-1");
  assert.equal(undoneElement.isDeleted, true);

  // Snapshot now only contains Bob's active stroke
  snapshot = service.getSnapshot(roomId);
  assert.equal(snapshot.elements.length, 1);
  assert.equal(snapshot.elements[0].id, "stroke-bob-1");

  // Alice redos her stroke
  const redoneElement = service.redo(roomId, user1);
  assert.ok(redoneElement);
  assert.equal(redoneElement.id, "stroke-alice-1");
  assert.equal(redoneElement.isDeleted, false);

  // Both elements are active again
  snapshot = service.getSnapshot(roomId);
  assert.equal(snapshot.elements.length, 2);
});

test("CollaborationService tracks participant presence and cursors", () => {
  const service = new CollaborationService();
  const roomId = "test-room-presence";

  service.addParticipant(roomId, "sock-1", { id: "u1", username: "alice", email: "a@test.com" });
  service.addParticipant(roomId, "sock-2", { id: "u2", username: "bob", email: "b@test.com" });

  let presence = service.getPresence(roomId);
  assert.equal(presence.length, 2);

  service.updateCursor(roomId, "sock-1", { x: 100, y: 200 });
  presence = service.getPresence(roomId);
  const alice = presence.find((p) => p.id === "u1");
  assert.deepEqual(alice.cursor, { x: 100, y: 200 });

  service.removeParticipant(roomId, "sock-1");
  presence = service.getPresence(roomId);
  assert.equal(presence.length, 1);
  assert.equal(presence[0].id, "u2");
});

test("CollaborationService enforces 10,000 max elements per room limit", () => {
  const service = new CollaborationService();
  const roomId = "test-room-limit";
  const state = service.getRoomState(roomId);

  // Pre-fill state to 10,000 elements
  for (let i = 0; i < 10000; i++) {
    state.elements.set(`el-${i}`, {
      elementId: `el-${i}`,
      id: `el-${i}`,
      isDeleted: false
    });
  }

  // Attempting to add 10,001st element throws CapacityLimitError
  assert.throws(
    () => service.applyStroke(roomId, "u-overflow", { id: "el-10001", type: "path" }),
    (err) => {
      assert.equal(err.code, "CAPACITY_LIMIT_EXCEEDED");
      assert.match(err.message, /10000 elements per room/);
      return true;
    }
  );
});

test("CollaborationService enforces max stroke points limit", () => {
  const service = new CollaborationService();
  const roomId = "test-room-points";

  const hugePoints = Array.from({ length: 5001 }, (_, i) => [i, i]);

  assert.throws(
    () =>
      service.applyStroke(roomId, "u-points", {
        id: "huge-stroke",
        type: "path",
        properties: { points: hugePoints }
      }),
    (err) => {
      assert.equal(err.code, "CAPACITY_LIMIT_EXCEEDED");
      assert.match(err.message, /maximum 5000 points/);
      return true;
    }
  );
});

test("CollaborationService prunes undo stack beyond 50 operations", () => {
  const service = new CollaborationService();
  const roomId = "test-room-history";
  const userId = "u-history";

  for (let i = 0; i < 60; i++) {
    service.applyStroke(roomId, userId, { id: `el-hist-${i}`, type: "rect" });
  }

  const state = service.getRoomState(roomId);
  const history = service.getUserHistory(state, userId);
  assert.equal(history.undoStack.length, 50);
});

test("CollaborationService clears canvas and updates versions", () => {
  const service = new CollaborationService();
  const roomId = "test-room-clear";

  service.applyStroke(roomId, "u1", { id: "s1", type: "path" });
  service.applyStroke(roomId, "u2", { id: "s2", type: "path" });

  const cleared = service.clearCanvas(roomId, "u1");
  assert.equal(cleared.length, 2);

  const snapshot = service.getSnapshot(roomId);
  assert.equal(snapshot.elements.length, 0);
});

test("CollaborationService syncOfflineBatch successfully processes queued operations", () => {
  const service = new CollaborationService();
  const roomId = "test-room-offline";
  const userId = "u-reconnect";

  const ops = [
    { type: "draw-stroke", payload: { id: "sync-1", type: "path", properties: { stroke: "#fff" } } },
    { type: "draw-stroke", payload: { id: "sync-2", type: "rect", properties: { width: 50 } } },
    { type: "delete", elementId: "sync-1" }
  ];

  const result = service.syncOfflineBatch(roomId, userId, ops, 1);

  assert.equal(result.appliedCount, 3);
  assert.equal(result.rejectedCount, 0);

  const snapshot = service.getSnapshot(roomId);
  assert.equal(snapshot.elements.length, 1);
  assert.equal(snapshot.elements[0].id, "sync-2");
});

test("CollaborationService syncOfflineBatch rejects invalid operations gracefully", () => {
  const service = new CollaborationService();
  const roomId = "test-room-offline-invalid";
  const userId = "u-reconnect";

  const ops = [
    { type: "draw-stroke" }, // Missing payload and elementId
    { type: "draw-stroke", payload: { id: "valid-1", type: "circle" } }
  ];

  const result = service.syncOfflineBatch(roomId, userId, ops, 1);

  assert.equal(result.appliedCount, 1);
  assert.equal(result.rejectedCount, 1);
  assert.equal(result.rejectedOps[0].reason, "MISSING_ELEMENT_ID");
});

test("CollaborationService returns empty undo/redo when stack is empty", () => {
  const service = new CollaborationService();
  const roomId = "test-empty-history";

  const undone = service.undo(roomId, "nonexistent-user");
  const redone = service.redo(roomId, "nonexistent-user");

  assert.equal(undone, null);
  assert.equal(redone, null);
});
