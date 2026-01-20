const express = require("express");
const router = express.Router();
const dailyLogsController = require("../controllers/dailyLogsController");
const { auth, adminOrSuperAdmin } = require("../middleware/auth");

// ⚠️ IMPORTANT: Specific routes BEFORE general routes

// Deduction rules routes (specific)
router.get("/deduction-rules", auth, adminOrSuperAdmin, dailyLogsController.getDeductionRules);
router.put("/deduction-rules", auth, adminOrSuperAdmin, dailyLogsController.updateDeductionRules);

// Other specific routes
router.get("/summary", auth, dailyLogsController.getDailySummary);
router.get("/deduction-summary", auth, dailyLogsController.getDeductionSummary);
router.get("/payroll-report", auth, dailyLogsController.getMonthlyPayrollDeduction);
router.get("/reports/late-employees", auth, dailyLogsController.getLateEmployeesReport);

// General routes (these should come LAST)
router.get("/", auth, dailyLogsController.getDailyLogs);
router.get("/:id", auth, dailyLogsController.getDailyLogById); // This catches everything

module.exports = router;