const mongoose = require("mongoose");

const breakSchema = new mongoose.Schema({
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendance",
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  breakStart: { type: Date, required: true },
  breakEnd: { type: Date },
  breakDuration: { type: Number, default: 0 }, // in minutes
  reason: { type: String },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Break", breakSchema);
