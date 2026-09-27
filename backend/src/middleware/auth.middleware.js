import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header"
      }
    });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: {
        code: "SERVER_MISCONFIGURATION",
        message: "JWT_SECRET is not configured on server"
      }
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Authorization token expired"
        : "Invalid authorization token";

    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message
      }
    });
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (secret) {
      try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
      } catch {
        // Ignore token error for optional auth
      }
    }
  }

  next();
}

export default { authenticate, optionalAuth };
