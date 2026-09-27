import test from "node:test";
import assert from "node:assert/strict";

import { validate } from "../src/middleware/validate.middleware.js";
import { AppError, errorHandler, notFoundHandler } from "../src/middleware/error.middleware.js";

function createRes(capture) {
  return {
    status(code) {
      capture.statusCode = code;
      return this;
    },
    json(data) {
      capture.body = data;
      return this;
    }
  };
}

test("validate middleware rejects missing required fields", () => {
  const schema = {
    body: {
      email: { required: true, type: "string" },
      username: { required: true, minLength: 3 },
      visibility: { enum: ["public", "private"] }
    }
  };

  const capture = {};
  const req = { body: { email: "", username: "ab" } };

  validate(schema)(req, createRes(capture), () => {});

  assert.equal(capture.statusCode, 400);
  assert.equal(capture.body.error.code, "VALIDATION_ERROR");
  assert.equal(capture.body.error.details[0].field, "email");
  assert.equal(capture.body.error.details[1].field, "username");
});

test("validate middleware rejects invalid enum values and malformed strings", () => {
  const schema = {
    body: {
      email: {
        required: true,
        type: "string",
        pattern: /^\S+@\S+\.\S+$/,
        patternMessage: "invalid email"
      },
      visibility: { enum: ["public", "private"] }
    }
  };

  const capture = {};
  validate(schema)(
    { body: { email: "bad-email", visibility: "internal" } },
    createRes(capture),
    () => {}
  );

  assert.equal(capture.body.error.code, "VALIDATION_ERROR");
  assert.deepEqual(capture.body.error.details.map((d) => d.field).sort(), ["email", "visibility"]);
});

test("validate middleware allows valid payloads through", () => {
  let nextCalled = false;
  validate({
    body: {
      email: { required: true, type: "string" },
      username: { required: true, minLength: 3 }
    }
  })({ body: { email: "user@example.com", username: "valid-user" } }, createRes({}), () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test("errorHandler formats AppError payloads with details", () => {
  const capture = {};
  const err = new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS", { attempts: 1 });

  errorHandler(err, {}, createRes(capture), () => {});

  assert.equal(capture.statusCode, 401);
  assert.equal(capture.body.error.code, "INVALID_CREDENTIALS");
  assert.equal(capture.body.error.message, "Invalid credentials");
  assert.deepEqual(capture.body.error.details, { attempts: 1 });
});

test("errorHandler formats duplicate key conflicts", () => {
  const capture = {};
  const err = { code: 11000, keyPattern: { email: 1, username: 1 } };

  errorHandler(err, {}, createRes(capture), () => {});

  assert.equal(capture.body.error.code, "DUPLICATE_RESOURCE");
  assert.equal(capture.body.error.message, "A resource with the specified email, username already exists");
});

test("errorHandler converts cast errors into validation responses", () => {
  const capture = {};
  const err = { name: "CastError", path: "_id" };

  errorHandler(err, {}, createRes(capture), () => {});

  assert.equal(capture.body.error.code, "INVALID_IDENTIFIER");
  assert.match(capture.body.error.message, /Invalid identifier format/);
});

test("notFoundHandler responds with the standard 404 payload", () => {
  const capture = {};
  notFoundHandler({ method: "GET", originalUrl: "/api/missing" }, createRes(capture), () => {});

  assert.equal(capture.statusCode, 404);
  assert.equal(capture.body.error.code, "NOT_FOUND");
  assert.match(capture.body.error.message, /Cannot GET \/api\/missing/);
});
