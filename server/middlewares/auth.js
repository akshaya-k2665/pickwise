const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // 1️⃣ Get token from header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expect: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 2️⃣ Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded includes both id and role (from login)
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };

    next(); // Pass control to next middleware/route
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
