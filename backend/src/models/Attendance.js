const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    // ================= BASIC ATTENDANCE =================
    clockInTime: Date,
    clockOutTime: Date,

    status: {
      type: String,
      enum: ["CHECKED_IN", "ON_BREAK", "CHECKED_OUT", "ON_LEAVE"],
    },

    location: {
      lat: Number,
      long: Number,
      officeTag: String,
    },

    photoReference: String,

    // ================= WORK & BREAK =================
    workDuration: { type: Number, default: 0 },        // minutes
    netWorkMinutes: { type: Number, default: 0 },      // after breaks
    netWorkHours: { type: Number, default: 0 },        // UI use

    totalBreakDuration: { type: Number, default: 0 },  // minutes

    breakSummary: {
      totalBreaks: { type: Number, default: 0 },
      totalBreakHours: { type: Number, default: 0 },
    },

    // ================= SHIFT INFO =================
    shiftStartTime: { type: String, default: "09:00" },
    shiftEndTime: { type: String, default: "18:00" },

    // ================= LATE ENGINE =================
    lateFlag: { type: Boolean, default: false },
    lateMinutes: { type: Number, default: 0 },
    lateDeduction: { type: Number, default: 0 },

    // ================= EARLY EXIT ENGINE =================
    earlyExitFlag: { type: Boolean, default: false },
    earlyExitMinutes: { type: Number, default: 0 },
    earlyExitDeduction: { type: Number, default: 0 },

    // ================= ABSENT / HALF DAY =================
    attendanceStatus: {
      type: String,
      enum: ["PRESENT", "HALF_DAY", "ABSENT"],
      default: "PRESENT",
    },

    absentDeduction: { type: Number, default: 0 },

    // ================= OVERTIME =================
    overtimeMinutes: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    overtimeAmount: { type: Number, default: 0 },

    // ================= FINAL DEDUCTION =================
    totalDeduction: { type: Number, default: 0 },

    deductionBreakdown: [
      {
        type: {
          type: String,
          enum: ["LATE", "EARLY_EXIT", "HALF_DAY_ABSENT", "ABSENT"],
        },
        minutes: Number,
        amount: Number,
        description: String,
        workMinutes: Number,
      },
    ],

  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
