import { Router } from "express";
import rateLimit from "express-rate-limit";
import AuthController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

const router = Router();

// M-1: Strict rate limiter for auth endpoints — 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many authentication attempts, please wait 15 minutes before trying again"
    }
  }
});

// M-2: Stronger password policy — min 8 chars, must contain letter + digit
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const registerSchema = {
  body: {
    email: {
      required: true,
      type: "string",
      pattern: /^\S+@\S+\.\S+$/,
      patternMessage: "Must be a valid email address"
    },
    username: {
      required: true,
      type: "string",
      minLength: 3,
      maxLength: 30
    },
    password: {
      required: true,
      type: "string",
      minLength: 8, // M-2: raised from 6 to 8
      maxLength: 128,
      pattern: PASSWORD_PATTERN, // M-2: must contain at least one letter and one digit
      patternMessage: "Password must be at least 8 characters and contain at least one letter and one digit"
    }
  }
};

const loginSchema = {
  body: {
    email: {
      required: true,
      type: "string"
    },
    password: {
      required: true,
      type: "string"
    }
  }
};

router.post("/register", authLimiter, validate(registerSchema), AuthController.register);
router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.get("/me", authenticate, AuthController.me);

export default router;
