const mongoose = require("mongoose");

const payrollSettingSchema = new mongoose.Schema({
    latePenaltyPerMinute: { type: Number, default: 10 },
    earlyExitPenaltyPerMinute: { type: Number, default: 15 },
    absentFullDayPenalty: { type: Number, default: 1000 },
    minimumOvertimeMinutes: { type: Number, default: 15 },
    overtimeRatePerMinute: { type: Number, default: 5 },
    graceLateMinutes: { type: Number, default: 15 },
    graceEarlyMinutes: { type: Number, default: 15 },
    standardShiftMinutes: { type: Number, default: 480 }, // 8 hours
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("PayrollSetting", payrollSettingSchema);
