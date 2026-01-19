const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * ============================
 * AUTH MIDDLEWARE
 * ============================
 * Verifies JWT token and attaches the user object to req.user
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header (Bearer TOKEN)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user from DB without password
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/**
 * ============================
 * SUPER ADMIN ONLY MIDDLEWARE
 * ============================
 * Restricts access to only users with role 'super_admin'
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super Admin only" });
  }
  next();
};

module.exports = {
  auth,
  superAdminOnly,
};
