// models/PayrollSetting.js - UPDATED WITH TIERED PENALTIES & OVERTIME

const mongoose = require("mongoose");

const payrollSettingSchema = new mongoose.Schema({
    // ================= LATE PENALTIES (TIERED) =================
    lateGracePeriodMinutes: {
        type: Number,
        default: 30,
        min: 0,
        description: "Grace period before penalties start (30 minutes)"
    },

    // Tiered Late Penalties
    latePenalties: {
        // After 30 min grace, up to 1 hour late
        after30Minutes: {
            type: Number,
            default: 100,
            min: 0,
            description: "Penalty for 30min - 1 hour late"
        },
        // 1 hour late
        after1Hour: {
            type: Number,
            default: 200,
            min: 0,
            description: "Penalty for 1 - 1.5 hours late"
        },
        // 1.5 hours late
        after1AndHalfHours: {
            type: Number,
            default: 250,
            min: 0,
            description: "Penalty for 1.5+ hours late"
        },
    },

    // ================= OVERTIME BONUSES (TIERED) =================
    overtimeBonuses: {
        // 1 hour overtime
        after1Hour: {
            type: Number,
            default: 150,
            min: 0,
            description: "Bonus for 1 hour overtime"
        },
        // 2 hours overtime
        after2Hours: {
            type: Number,
            default: 250,
            min: 0,
            description: "Bonus for 2 hours overtime"
        },
        // 3 hours overtime
        after3Hours: {
            type: Number,
            default: 350,
            min: 0,
            description: "Bonus for 3 hours overtime"
        },
        // 4+ hours overtime
        after4Hours: {
            type: Number,
            default: 450,
            min: 0,
            description: "Bonus for 4+ hours overtime"
        },
    },

    // ================= EARLY EXIT PENALTIES =================
    earlyExitGraceMinutes: {
        type: Number,
        default: 15,
        min: 0,
        description: "Grace period for early exit"
    },

    earlyExitPenaltyPerMinute: {
        type: Number,
        default: 15,
        min: 0,
        description: "Penalty per minute for early exit beyond grace"
    },

    // ================= ABSENCE PENALTIES =================
    absentFullDayPenalty: {
        type: Number,
        default: 1000,
        min: 0,
        description: "Full day absent penalty"
    },

    halfDayPenalty: {
        type: Number,
        default: 500,
        min: 0,
        description: "Half day penalty"
    },

    halfDayThresholdMinutes: {
        type: Number,
        default: 240,  // 4 hours
        min: 0,
        description: "Minimum minutes worked to avoid half-day penalty"
    },

    // ================= SHIFT CONFIGURATION =================
    standardShiftMinutes: {
        type: Number,
        default: 480,  // 8 hours
        min: 0,
        description: "Standard shift duration in minutes"
    },

    // ================= BREAK PENALTIES =================
    maxBreakMinutes: {
        type: Number,
        default: 60,
        min: 0,
        description: "Maximum allowed break time"
    },

    excessBreakPenaltyPerMinute: {
        type: Number,
        default: 10,
        min: 0,
        description: "Penalty per minute for excess break time"
    },

    // ================= STATUS & METADATA =================
    isActive: {
        type: Boolean,
        default: true
    },

    effectiveFrom: {
        type: Date,
        default: Date.now,
        description: "Date from which this setting is effective"
    },

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
        maxlength: 500
    },
}, {
    timestamps: true
});

// Index for quick lookup
payrollSettingSchema.index({ isActive: 1, effectiveFrom: -1 });

// 🔥 Ensure only one active setting at a time
payrollSettingSchema.pre("save", async function (next) {
    if (this.isActive && this.isNew) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isActive: false }
        );
    }
    next();
});

// 🔥 Method to get current active setting
payrollSettingSchema.statics.getActiveSetting = async function () {
    let setting = await this.findOne({ isActive: true });
    
    // If no active setting exists, create default one
    if (!setting) {
        setting = await this.create({
            isActive: true,
            notes: "Default payroll settings"
        });
    }
    
    return setting;
};

module.exports = mongoose.model("PayrollSetting", payrollSettingSchema);