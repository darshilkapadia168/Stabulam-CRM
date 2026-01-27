/**
 * ============================
 * ROLE-BASED AUTHORIZATION MIDDLEWARE
 * ============================
 * Works alongside permission middleware for role-level access control
 */

/**
 * Authorize based on user roles
 * Usage: authorizeRoles('admin', 'super_admin')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // ✅ FIX: Normalize role comparison (case-insensitive)
    const userRole = req.user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

    // Check if user has required role
    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * ✅ NEW: Authorize all authenticated users to view their own data
 * Used for /my-logs endpoints where everyone (including admins) can access their personal records
 */
const authorizeOwnDataAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }

  console.log('✅ User authorized to view own data:', req.user.role, '- User ID:', req.user.id);
  next();
};

/**
 * Authorize only non-admin employees (STRICT employee-only access)
 * Use this ONLY for endpoints that should explicitly block admins
 * For example: employee-specific features that admins shouldn't access
 */
const authorizeEmployeeOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }

  // ✅ FIX: Normalize role for case-insensitive comparison
  const userRole = req.user.role.toLowerCase();
  
  // List of employee roles (all lowercase)
  const employeeRoles = ['employee', 'sr_employee', 'jr_employee', 'intern', 'management'];

  // ✅ DEBUG logging
  console.log('🔍 authorizeEmployeeOnly - User Role:', userRole);

  // Block admin and super_admin from employee-only endpoints
  if (userRole === 'admin' || userRole === 'super_admin') {
    console.log('❌ Admin blocked from employee-only endpoint');
    return res.status(403).json({
      success: false,
      message: 'This endpoint is for employees only.',
    });
  }

  // Allow only employee roles
  if (!employeeRoles.includes(userRole)) {
    console.log('❌ Invalid employee role:', userRole);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employee access required.',
      userRole: req.user.role,
      debug: {
        receivedRole: req.user.role,
        normalizedRole: userRole,
        expectedRoles: employeeRoles,
        isEmployee: employeeRoles.includes(userRole)
      }
    });
  }

  console.log('✅ Employee authorized:', userRole);
  next();
};

module.exports = { 
  authorizeRoles,
  authorizeEmployeeOnly,
  authorizeOwnDataAccess  // ✅ NEW export
};