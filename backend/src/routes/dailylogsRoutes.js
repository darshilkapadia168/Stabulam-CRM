// routes/payrollSettingsRoutes.js
const express = require("express");
const router = express.Router();
const PayrollSetting = require("../models/PayrollSetting");
const { auth } = require("../middleware/auth");

// Get active payroll setting
router.get("/", auth, async (req, res) => {
  const setting = await PayrollSetting.findOne({ isActive: true });
  res.json({ success: true, data: setting });
});

// Update payroll setting
router.put("/", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only admin can update payroll settings" });
  }
  const updates = req.body;
  const setting = await PayrollSetting.findOneAndUpdate(
    { isActive: true },
    updates,
    { new: true, upsert: true } // create if not exists
  );
  res.json({ success: true, data: setting, message: "Payroll settings updated!" });
});

module.exports = router;
