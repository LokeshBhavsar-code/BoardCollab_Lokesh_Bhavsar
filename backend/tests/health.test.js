import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

test("health endpoint contract is defined", async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const responseData = await response.json();

    assert.equal(response.status, 200);
    assert.equal(responseData.status, "ok");
    assert.equal(responseData.service, "boardcollab-api");
    assert.ok(responseData.services);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});
