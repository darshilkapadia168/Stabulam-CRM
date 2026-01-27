const express = require("express");
const router = express.Router();
const dailyLogsController = require("../controllers/dailylogs.controller");
const { auth, adminOrSuperAdmin } = require("../middleware/auth.middleware");
const { can } = require("../middleware/permissions.middleware");
const { authorizeRoles, authorizeEmployeeOnly,authorizeOwnDataAccess } = require('../middleware/authorization.middleware');

/**
 * ============================
 * 🔴 ADMIN ROUTES - All Employees Access
 * ============================
 * These routes must come FIRST to avoid conflicts with generic routes
 */

// Get all employees daily logs with filters (Admin only)
router.get(
  '/admin/all',
  auth,
  authorizeRoles('admin', 'super_admin'),
  can('attendance', 'view'),
  dailyLogsController.getAllEmployeesDailyLogs
);

// ✅ MOVE THESE ADMIN PERSONAL ROUTES HERE - BEFORE /my-logs
// Get admin's own daily logs
router.get(
  '/admin/my-logs',
  auth,
  authorizeRoles('admin', 'super_admin'),
  can('attendance', 'view'),
  dailyLogsController.getMyDailyLogs
);

// Get admin's single daily log
router.get(
  '/admin/my-logs/:logId',
  auth,
  authorizeRoles('admin', 'super_admin'),
  can('attendance', 'view'),
  dailyLogsController.getMySingleDailyLog
);

// Get single daily log - any employee (Admin only)
router.get(
  '/admin/:logId',
  auth,
  authorizeRoles('admin', 'super_admin'),
  can('attendance', 'view'),
  dailyLogsController.getAdminSingleDailyLog
);

// Get late employees report (Admin only)
router.get(
  '/admin/reports/late-employees',
  auth,
  authorizeRoles('admin', 'super_admin'),
  can('attendance', 'view'),
  dailyLogsController.getLateEmployeesReport
);

// Get daily summary (Admin only)
router.get(
  '/admin/summary',
  auth,
  authorizeRoles('admin', 'super_admin'),
  can('attendance', 'view'),
  dailyLogsController.getDailySummary
);

/**
 * ============================
 * 🟢 EMPLOYEE ROUTES - Own Data Only
 * ============================
 * Employees can ONLY access their own data
 */

// Get my daily logs (Employee only - own records)
router.get(
  '/my-logs',
  auth,
  authorizeOwnDataAccess,
  dailyLogsController.getMyDailyLogs
);

// Get my single daily log (Employee only - own record)
router.get(
  '/my-logs/:logId',
  auth,
  authorizeOwnDataAccess,
  dailyLogsController.getMySingleDailyLog
);

/**
 * ============================
 * 🟡 DEDUCTION MANAGEMENT ROUTES (Admin Only)
 * ============================
 */

// Get deduction rules
router.get(
  "/deduction-rules",
  auth,
  adminOrSuperAdmin,
  dailyLogsController.getDeductionRules
);

// Update deduction rules
router.put(
  "/deduction-rules",
  auth,
  adminOrSuperAdmin,
  dailyLogsController.updateDeductionRules
);

/**
 * ============================
 * 🟠 REPORT & SUMMARY ROUTES
 * ============================
 * These routes are role-aware (filter data based on user role)
 */

// Get deduction summary (role-aware)
router.get(
  "/deduction-summary",
  auth,
  can('attendance', 'view'),
  dailyLogsController.getDeductionSummary
);

// Get monthly payroll deduction report (role-aware)
router.get(
  "/payroll-report",
  auth,
  can('attendance', 'view'),
  dailyLogsController.getMonthlyPayrollDeduction
);

/**
 * ============================
 * 🔵 SPECIFIC DETAIL ROUTES
 * ============================
 * Must come BEFORE generic /:id route
 */

// Get detailed attendance view (role-aware with ownership check)
router.get(
  "/details/:id",
  auth,
  can('attendance', 'view'),
  dailyLogsController.getAttendanceDetailView
);

/**
 * ============================
 * ⚪ GENERIC ROUTES (For Backward Compatibility)
 * ============================
 * These routes auto-detect role and filter accordingly
 * MUST come LAST to avoid route conflicts
 */

// Get daily logs (role-aware: admin sees all, employee sees own)
router.get(
  "/",
  auth,
  can('attendance', 'view'),
  dailyLogsController.getDailyLogs
);

// Get daily log by ID (role-aware with ownership check)
router.get(
  "/:id",
  auth,
  can('attendance', 'view'),
  dailyLogsController.getDailyLogById
);

module.exports = router;