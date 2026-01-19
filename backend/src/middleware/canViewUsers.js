/**
 * ============================
 * REFACTORED PERMISSION MIDDLEWARE (permission.js)
 * ============================
 * Updated to check BOTH Admin and Super Admin roles first
 */
const can = (moduleName, action) => {
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔓 Admin and Super Admin Bypass: Automatically allow
    if (req.user.role === "super_admin" || req.user.role === "admin") {
      return next();
    }

    // 🔐 Check dynamic permissions: req.user.permissions[module][action]
    // Uses optional chaining to prevent crashes if module or action is missing
    const hasPermission = req.user.permissions?.[moduleName]?.[action];

    if (hasPermission === true) {
      return next();
    }

    // ❌ Deny Access
    return res.status(403).json({
      status: "fail",
      message: `Access denied: You do not have [${action}] rights for [${moduleName}].`,
    });
  };
};

module.exports = { can };