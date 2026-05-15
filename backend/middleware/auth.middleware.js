const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "veritas-report-app-secret-key-2026";
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not defined in environment variables! Using a temporary fallback secret.");
}
const JWT_EXPIRES_IN = "7d";


const generateToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, email: user.email, name: user.name, role: user.role },
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

// Middleware to restrict access based on roles
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access Denied", 
        message: "You do not have permission to perform this action." 
      });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  authMiddleware,
  roleCheck,
};
