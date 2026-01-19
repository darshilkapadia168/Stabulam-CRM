const Attendance = require("../models/Attendance");
const Break = require("../models/Break");
const { getTodayDate } = require("../utils/date.util");


// 🔹 START BREAK
exports.startBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();
    const { reason } = req.body;

    // 1️⃣ Get attendance
    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
      status: "CHECKED_IN",
    });

    if (!attendance) {
      return res.status(400).json({
        message: "You must be checked in to start a break",
      });
    }

    // 2️⃣ Check active break
    const activeBreak = await Break.findOne({
      attendanceId: attendance._id,
      isActive: true,
    });

    if (activeBreak) {
      return res.status(400).json({
        message: "Break already active",
      });
    }

    // 3️⃣ Create break
    const newBreak = await Break.create({
      attendanceId: attendance._id,
      employeeId,
      breakStartTime: new Date(),
      reason,
    });

    // 4️⃣ Update attendance status
    attendance.status = "ON_BREAK";
    await attendance.save();

    return res.status(201).json({
      message: "Break started",
      data: {
        status: attendance.status,
        breakStartTime: newBreak.breakStartTime,
      },
    });
  } catch (error) {
    console.error("Start Break Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// 🔹 END BREAK
exports.endBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();

    // 1️⃣ Get attendance
    const attendance = await Attendance.findOne({
      employeeId,
      date: today,
      status: "ON_BREAK",
    });

    if (!attendance) {
      return res.status(400).json({
        message: "No active break found",
      });
    }

    // 2️⃣ Get active break
    const activeBreak = await Break.findOne({
      attendanceId: attendance._id,
      isActive: true,
    });

    if (!activeBreak) {
      return res.status(400).json({
        message: "No active break record",
      });
    }

    // 3️⃣ End break
    const endTime = new Date();
    const duration =
      Math.floor((endTime - activeBreak.breakStartTime) / 60000); // minutes

    activeBreak.breakEndTime = endTime;
    activeBreak.breakDuration = duration;
    activeBreak.isActive = false;
    await activeBreak.save();

    // 4️⃣ Update attendance
    attendance.status = "CHECKED_IN";
    attendance.totalBreakDuration += duration;
    await attendance.save();

    return res.status(200).json({
      message: "Break ended",
      data: {
        breakDuration: duration,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error("End Break Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
