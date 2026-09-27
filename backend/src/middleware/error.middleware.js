import logger from "../utils/logger.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
1
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", details = null) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details = null) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details = null) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", details = null) {
    super(message, 409, "CONFLICT", details);
  }
}

export class CapacityLimitError extends AppError {
  constructor(message = "Operating limit exceeded", details = null) {
    super(message, 422, "CAPACITY_LIMIT_EXCEEDED", details);
  }
}

export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
}

export function errorHandler(err, req, res, _next) {
  // Handle mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      error: {
        code: "INVALID_IDENTIFIER",
        message: `Invalid identifier format for ${err.path}`
      }
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      error: {
        code: "DUPLICATE_RESOURCE",
        message: `A resource with the specified ${fields.join(", ")} already exists`,
        details: fields
      }
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const details = Object.entries(err.errors).map(([field, error]) => ({
      field,
      message: error.message
    }));
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Database validation failed",
        details
      }
    });
  }

  // Custom AppError & subclasses
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError] ${err.code}: ${err.message}`, { path: req?.originalUrl, details: err.details });
    }
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
  }

  logger.error("[ServerError] Unexpected internal error", {
    message: err.message,
    stack: err.stack,
    path: req?.originalUrl
  });

  const status = err.statusCode || 500;
  return res.status(status).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected internal server error occurred"
    }
  });
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  CapacityLimitError,
  notFoundHandler,
  errorHandler
};
