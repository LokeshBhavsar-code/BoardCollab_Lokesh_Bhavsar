/**
 * Unit tests for PersistenceService:
 * - Queuing elements deduplicates by (roomId, elementId)
 * - flush() is a no-op when queue is empty
 * - Failed bulk writes re-queue items for retry
 * - flushRoom() only flushes elements matching the given roomId
 */
import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { PersistenceService } from "../src/services/persistence.service.js";
import CanvasElement from "../src/models/element.model.js";
import Session from "../src/models/session.model.js";

test.afterEach(() => {
  mock.restoreAll();
});

function makePersistenceService() {
  // Create a service with a very long flush interval so auto-flush doesn't interfere
  const svc = new PersistenceService(999_999);
  svc.stopAutoFlush(); // Stop the timer immediately
  return svc;
}

test("PersistenceService.queueElement deduplicates by (roomId, elementId)", () => {
  const svc = makePersistenceService();

  const el = { roomId: "room-1", elementId: "el-1", version: 1, type: "rect" };
  svc.queueElement(el);
  svc.queueElement({ ...el, version: 2 }); // Same key → overwrite
  svc.queueElement({ roomId: "room-1", elementId: "el-2", version: 1, type: "path" }); // Different key

  assert.equal(svc.pendingQueue.size, 2, "Queue should deduplicate by roomId:elementId");
  const deduped = svc.pendingQueue.get("room-1:el-1");
  assert.equal(deduped.version, 2, "Later update should overwrite earlier one");
});

test("PersistenceService.flush is a no-op when queue is empty", async () => {
  const svc = makePersistenceService();
  let bulkWriteCalled = false;
  mock.method(CanvasElement, "bulkWrite", async () => { bulkWriteCalled = true; });

  await svc.flush();

  assert.equal(bulkWriteCalled, false, "bulkWrite should not be called when queue is empty");
});

test("PersistenceService.flush writes all queued elements and clears queue", async () => {
  const svc = makePersistenceService();

  svc.queueElement({ roomId: "r1", elementId: "e1", sessionId: "s1", type: "path", properties: {}, version: 1, isDeleted: false });
  svc.queueElement({ roomId: "r1", elementId: "e2", sessionId: "s1", type: "rect", properties: {}, version: 1, isDeleted: false });

  let writtenOps = null;
  mock.method(CanvasElement, "bulkWrite", async (ops) => { writtenOps = ops; return {}; });
  mock.method(Session, "updateMany", async () => {});

  await svc.flush();

  assert.ok(writtenOps, "bulkWrite should have been called");
  assert.equal(writtenOps.length, 2, "Both elements should be written");
  assert.equal(svc.pendingQueue.size, 0, "Queue should be empty after flush");
});

test("PersistenceService.flush re-queues items on write failure", async () => {
  const svc = makePersistenceService();

  svc.queueElement({ roomId: "r1", elementId: "fail-el", sessionId: "s1", type: "path", properties: {}, version: 1, isDeleted: false });

  mock.method(CanvasElement, "bulkWrite", async () => {
    throw new Error("MongoNetworkError: connection timed out");
  });

  await svc.flush(); // Should NOT throw

  // Item should be re-queued for retry
  assert.equal(svc.pendingQueue.size, 1, "Failed items should be re-queued");
  assert.ok(svc.pendingQueue.has("r1:fail-el"), "Re-queued item should have same key");
});

test("PersistenceService.flush does not double-flush concurrently (isFlushing guard)", async () => {
  const svc = makePersistenceService();

  svc.queueElement({ roomId: "r2", elementId: "e3", sessionId: "s2", type: "path", properties: {}, version: 1, isDeleted: false });

  let callCount = 0;
  mock.method(CanvasElement, "bulkWrite", async () => {
    callCount++;
    return {};
  });
  mock.method(Session, "updateMany", async () => {});

  // Fire two flushes simultaneously
  await Promise.all([svc.flush(), svc.flush()]);

  assert.equal(callCount, 1, "Only one bulkWrite should fire due to isFlushing guard");
});

test("PersistenceService.flushRoom only flushes items for the given room", async () => {
  const svc = makePersistenceService();

  svc.queueElement({ roomId: "room-A", elementId: "el-a", sessionId: "s1", type: "path", properties: {}, version: 1, isDeleted: false });
  svc.queueElement({ roomId: "room-B", elementId: "el-b", sessionId: "s2", type: "rect", properties: {}, version: 1, isDeleted: false });

  let writtenCount = 0;
  mock.method(CanvasElement, "bulkWrite", async (ops) => { writtenCount = ops.length; return {}; });

  await svc.flushRoom("room-A");

  assert.equal(writtenCount, 1, "Only room-A's element should be written");
  assert.equal(svc.pendingQueue.size, 1, "room-B's element should remain in queue");
  assert.ok(svc.pendingQueue.has("room-B:el-b"), "room-B element should still be pending");
});
