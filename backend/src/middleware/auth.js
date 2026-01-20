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
// middleware/auth.js
const adminOrSuperAdmin = (req, res, next) => {
  console.log("=".repeat(60));
  console.log("🧾 ADMIN/SUPER_ADMIN MIDDLEWARE TRIGGERED");
  console.log("📍 Request URL:", req.method, req.originalUrl);
  console.log("👤 User object:", req.user);
  console.log("🔑 User role:", req.user?.role);
  
  if (!req.user) {
    console.log("❌ REJECTED: No user object");
    return res.status(403).json({
      message: "Authentication required",
    });
  }

  // ✅ Case-insensitive role check
  const userRole = req.user.role?.toLowerCase();
  const allowedRoles = ["admin", "super_admin"];
  
  if (!allowedRoles.includes(userRole)) {
    console.log("❌ REJECTED: Role not allowed");
    console.log("=".repeat(60));
    return res.status(403).json({
      success: false,
      message: `Access denied. Your role: ${req.user.role}`,
    });
  }
  
  console.log("✅ APPROVED: Access granted");
  console.log("=".repeat(60));
  next();
};





module.exports = {
  auth,
  superAdminOnly,
  adminOrSuperAdmin,
};
