/**
 * ============================
 * UPDATED PERMISSION MIDDLEWARE (permission.js)
 * ============================
 * IMPORTANT FIX: Uses optional chaining to properly check nested permissions
 */
const can = (moduleName, action) => {
  return (req, res, next) => {
    // Step 1: Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Step 2: 🔓 Admin and Super Admin Bypass (Priority Check)
    if (req.user.role === "super_admin" || req.user.role === "admin") {
      return next();
    }

    // Step 3: 🔐 Check dynamic permissions for regular users
    // CRITICAL: Use optional chaining to safely access nested properties
    const hasPermission = req.user.permissions?.[moduleName]?.[action];

    // Step 4: Explicit check for true (not just truthy)
    if (hasPermission === true) {
      return next();
    }

    // Step 5: ❌ Deny Access with detailed error
    return res.status(403).json({
      status: "fail",
      message: `Access denied: You do not have [${action}] rights for [${moduleName}].`,
      debug: {
        module: moduleName,
        action: action,
        userRole: req.user.role,
        hasModule: !!req.user.permissions?.[moduleName],
        modulePermissions: req.user.permissions?.[moduleName] || null
      }
    });
  };
};

module.exports = { can };

