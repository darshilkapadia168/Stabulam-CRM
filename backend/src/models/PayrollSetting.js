// models/PayrollSetting.js - UPDATED VERSION

const mongoose = require("mongoose");

const payrollSettingSchema = new mongoose.Schema({
    // ================= PENALTIES =================
    latePenaltyPerMinute: {
        type: Number,
        default: 10,
        min: 0
    },

    earlyExitPenaltyPerMinute: {
        type: Number,
        default: 15,
        min: 0
    },

    absentFullDayPenalty: {
        type: Number,
        default: 1000,
        min: 0
    },

    // 🆕 NEW FIELD: Half Day Penalty
    halfDayPenalty: {
        type: Number,
        default: 500,
        min: 0
    },

    // ================= OVERTIME =================
    minimumOvertimeMinutes: {
        type: Number,
        default: 30,
        min: 0
    },

    overtimeRatePerMinute: {
        type: Number,
        default: 5,
        min: 0
    },

    // ================= GRACE PERIODS =================
    graceLateMinutes: {
        type: Number,
        default: 15,
        min: 0
    },

    graceEarlyMinutes: {
        type: Number,
        default: 15,
        min: 0
    },

    // ================= SHIFT CONFIGURATION =================
    standardShiftMinutes: {
        type: Number,
        default: 480,  // 8 hours
        min: 0
    },

    // 🆕 NEW FIELD: Half Day Threshold
    halfDayThresholdMinutes: {
        type: Number,
        default: 240,  // 4 hours
        min: 0
    },

    // ================= STATUS =================
    isActive: {
        type: Boolean,
        default: true
    },

    // ================= METADATA (Optional but recommended) =================
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    notes: {
        type: String,
        default: "",
    },
}, {
    timestamps: true
});

// Index for quick lookup of active setting
payrollSettingSchema.index({ isActive: 1 });

// 🔥 IMPORTANT: Ensure only one active setting at a time
payrollSettingSchema.pre("save", async function (next) {
    if (this.isActive && this.isNew) {
        // Deactivate all other settings when creating a new active one
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model("PayrollSetting", payrollSettingSchema);