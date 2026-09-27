/**
 * Structured logger for BoardCollab backend services.
 * Formats entries cleanly and emits JSON logs in production or key-value logs in development.
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = (process.env.LOG_LEVEL || "info").toLowerCase();

function shouldLog(level) {
  const currentPriority = LOG_LEVELS[currentLevel] ?? 2;
  const targetPriority = LOG_LEVELS[level] ?? 2;
  return targetPriority <= currentPriority;
}

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    });
  }
  const metaStr = Object.keys(meta).length > 0 ? " " + JSON.stringify(meta) : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  error(message, meta = {}) {
    if (shouldLog("error")) {
      console.error(formatLog("error", message, meta));
    }
  },
  warn(message, meta = {}) {
    if (shouldLog("warn")) {
      console.warn(formatLog("warn", message, meta));
    }
  },
  info(message, meta = {}) {
    if (shouldLog("info")) {
      console.log(formatLog("info", message, meta));
    }
  },
  debug(message, meta = {}) {
    if (shouldLog("debug")) {
      console.debug(formatLog("debug", message, meta));
    }
  }
};

export default logger;
