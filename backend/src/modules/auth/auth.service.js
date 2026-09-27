import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";
import { AppError } from "../../middleware/error.middleware.js";

export class AuthService {
  static generateToken(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError("Server configuration error: JWT_SECRET missing in environment", 500);
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username
      },
      secret,
      { expiresIn }
    );
  }

  static async register({ email, username, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        throw new AppError("An account with this email already exists", 409, "USER_ALREADY_EXISTS");
      }
      throw new AppError("Username is already taken", 409, "USERNAME_TAKEN");
    }

    const salt = await bcrypt.genSalt(12); // M-7: OWASP recommends 12 rounds for new applications
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash
    });

    const token = AuthService.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        createdAt: user.createdAt
      },
      token
    };
  }

  static async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    user.lastSeenAt = new Date();
    await user.save();

    const token = AuthService.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt
      },
      token
    };
  }

  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt
    };
  }
}

export default AuthService;
