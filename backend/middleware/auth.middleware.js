const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "veritas-report-app-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// Express middleware to protect routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
};

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  authMiddleware,
};
