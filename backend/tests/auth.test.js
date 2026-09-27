import test, { mock } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../src/models/user.model.js";
import { AppError } from "../src/middleware/error.middleware.js";
import { AuthService } from "../src/modules/auth/auth.service.js";

test.afterEach(() => {
  mock.restoreAll();
});

test("AuthService.generateToken uses JWT_SECRET and includes user claims", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-123";

  const token = AuthService.generateToken({
    _id: "507f1f77bcf86cd799439011",
    email: "test@example.com",
    username: "boardtester"
  });

  const decoded = jwt.verify(token, "test-secret-123");

  assert.equal(decoded.id, "507f1f77bcf86cd799439011");
  assert.equal(decoded.email, "test@example.com");
  assert.equal(decoded.username, "boardtester");

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

test("AuthService.generateToken throws when JWT_SECRET is missing", () => {
  const previousSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  assert.throws(
    () =>
      AuthService.generateToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        username: "boardtester"
      }),
    /JWT_SECRET missing/
  );

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

test("AuthService.register rejects duplicate email addresses", async () => {
  mock.method(User, "findOne", async () => ({
    _id: "existing-user",
    email: "dup@example.com",
    username: "existing-user"
  }));

  await assert.rejects(
    () =>
      AuthService.register({
        email: "dup@example.com",
        username: "new-name",
        password: "secret123"
      }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, "USER_ALREADY_EXISTS");
      return true;
    }
  );
});

test("AuthService.register rejects duplicate usernames", async () => {
  mock.method(User, "findOne", async () => ({
    _id: "existing-user",
    email: "other@example.com",
    username: "taken-name"
  }));

  await assert.rejects(
    () =>
      AuthService.register({
        email: "new@example.com",
        username: "taken-name",
        password: "secret123"
      }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, "USERNAME_TAKEN");
      return true;
    }
  );
});

test("AuthService.register creates a user and returns a token", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-123";

  mock.method(bcrypt, "genSalt", async () => "salt");
  mock.method(bcrypt, "hash", async (password) => `hashed:${password}`);
  mock.method(User, "findOne", async () => null);
  mock.method(User, "create", async ({ email, username, passwordHash }) => ({
    _id: "507f1f77bcf86cd799439022",
    email,
    username,
    passwordHash,
    createdAt: new Date("2024-01-01T00:00:00.000Z")
  }));

  const result = await AuthService.register({
    email: "new@example.com",
    username: "new-user",
    password: "secret123"
  });

  assert.equal(result.user.email, "new@example.com");
  assert.equal(result.user.username, "new-user");
  assert.ok(typeof result.token === "string");

  const decoded = jwt.verify(result.token, "test-secret-123");
  assert.equal(decoded.email, "new@example.com");
  assert.equal(decoded.username, "new-user");

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

test("AuthService.login authenticates valid credentials and updates lastSeenAt", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-123";

  const userDoc = {
    _id: "user-1",
    email: "alice@example.com",
    username: "alice",
    passwordHash: "hashed:secret123",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    lastSeenAt: null,
    save: async function () {
      this.lastSeenAt = new Date("2024-02-01T00:00:00.000Z");
      return this;
    }
  };

  mock.method(User, "findOne", async () => userDoc);
  mock.method(bcrypt, "compare", async (password) => password === "secret123");

  const result = await AuthService.login({ email: "alice@example.com", password: "secret123" });

  assert.equal(result.user.username, "alice");
  assert.ok(result.user.lastSeenAt instanceof Date);
  assert.equal(result.user.email, "alice@example.com");
  assert.ok(typeof result.token === "string");

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

test("AuthService.login rejects invalid credentials", async () => {
  mock.method(User, "findOne", async () => ({
    _id: "user-1",
    email: "alice@example.com",
    username: "alice",
    passwordHash: "hashed:secret123"
  }));
  mock.method(bcrypt, "compare", async () => false);

  await assert.rejects(
    () => AuthService.login({ email: "alice@example.com", password: "wrongpass" }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, "INVALID_CREDENTIALS");
      return true;
    }
  );
});

test("AuthService.getCurrentUser returns the current user payload", async () => {
  mock.method(User, "findById", async () => ({
    _id: "user-1",
    email: "alice@example.com",
    username: "alice",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    lastSeenAt: new Date("2024-02-01T00:00:00.000Z")
  }));

  const user = await AuthService.getCurrentUser("user-1");

  assert.equal(user.username, "alice");
  assert.equal(user.email, "alice@example.com");
  assert.ok(user.lastSeenAt instanceof Date);
});

test("AuthService.getCurrentUser throws a not found error for missing users", async () => {
  mock.method(User, "findById", async () => null);

  await assert.rejects(
    () => AuthService.getCurrentUser("missing-user"),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, "USER_NOT_FOUND");
      return true;
    }
  );
});

test("AuthService.login rejects when email does not exist", async () => {
  mock.method(User, "findOne", async () => null);

  await assert.rejects(
    () => AuthService.login({ email: "ghost@example.com", password: "Password123!" }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, "INVALID_CREDENTIALS");
      return true;
    }
  );
});

test("AuthService.register normalizes lowercase email and trims username", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-123";

  mock.method(bcrypt, "genSalt", async () => "salt");
  mock.method(bcrypt, "hash", async (password) => `hashed:${password}`);
  mock.method(User, "findOne", async () => null);
  mock.method(User, "create", async (data) => ({
    _id: "507f1f77bcf86cd799439099",
    ...data,
    createdAt: new Date()
  }));

  const res = await AuthService.register({
    email: "   User.Capital@EXAMPLE.COM   ",
    username: "   trimmedUser   ",
    password: "Password123!"
  });

  assert.equal(res.user.email, "user.capital@example.com");
  assert.equal(res.user.username, "trimmedUser");

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

test("AuthService token payload expires in expected timeframe", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-123";

  const token = AuthService.generateToken({
    _id: "u-expire",
    email: "exp@example.com",
    username: "expuser"
  });

  const decoded = jwt.decode(token);
  assert.ok(decoded.exp > decoded.iat);

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});
