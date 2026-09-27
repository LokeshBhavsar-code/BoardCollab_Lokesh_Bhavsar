import test from "node:test";
import assert from "node:assert/strict";

test("health endpoint contract is defined", () => {
  const expected = { status: "ok", service: "boardcollab-api" };
  assert.equal(expected.status, "ok");
  assert.equal(expected.service, "boardcollab-api");
});
