const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Break = require("../models/Break");
const { getTodayDate } = require("../utils/date.util");

// ============================================
// 🆕 LATE MARK CALCULATION UTILITY
// ============================================
const calculateLateMark = (clockInTime, shiftStartTime = "09:00", gracePeriodMinutes = 15) => {
  const clockIn = new Date(clockInTime);
  
  // Parse shift start time (format: "09:00")
  const [shiftHours, shiftMinutes] = shiftStartTime.split(':').map(Number);
  
  // Create expected shift start datetime for today
  const shiftStart = new Date(clockIn);
  shiftStart.setHours(shiftHours, shiftMinutes, 0, 0);
  
  // Add grace period to shift start time
  const graceEndTime = new Date(shiftStart.getTime() + gracePeriodMinutes * 60000);
  
  // Calculate if late
  const isLate = clockIn > graceEndTime;
  
  // Calculate late minutes (from actual shift start, not grace end)
  const lateMinutes = isLate ? Math.floor((clockIn - shiftStart) / 60000) : 0;
  
  return {
    lateFlag: isLate,
    lateMinutes: lateMinutes,
    shiftStartTime: shiftStartTime,
    gracePeriodMinutes: gracePeriodMinutes,
    expectedClockInTime: shiftStart,
    actualClockInTime: clockIn,
    graceEndTime: graceEndTime
  };
};

/**
 * =========================
 * CLOCK IN (WITH LATE MARK CALCULATION)
 * =========================
 */
exports.clockIn = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();
    const { latitude, longitude, officeTag } = req.body;

    // Get uploaded photo path
    const photoReference = req.file ? `/api/uploads/attendance/${req.file.filename}` : null;

    // Validate location
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required for clock-in" });
    }

    // 1️⃣ Check approved leave
    const leave = await Leave.findOne({ employeeId, date: today, status: "APPROVED" });
    if (leave) {
      return res.status(400).json({ message: "You are on approved leave today" });
    }

    // 2️⃣ Check attendance
    let attendance = await Attendance.findOne({ employeeId, date: today });
    
    const clockInTime = new Date();
    
    // 🆕 3️⃣ CALCULATE LATE MARK
    // TODO: Fetch shift time from employee profile if available
    // For now using default 09:00 AM with 15 min grace
    const lateMarkData = calculateLateMark(clockInTime, "09:00", 15);

    if (attendance) {
      if (attendance.status === "CHECKED_IN" || attendance.status === "ON_BREAK") {
        return res.status(400).json({ message: "Already clocked in" });
      }
      // Allow new clock-in if previously checked out
      attendance.clockInTime = clockInTime;
      attendance.clockOutTime = null;
      attendance.status = "CHECKED_IN";
      attendance.workDuration = 0;
      attendance.photoReference = photoReference;
      attendance.location = {
        lat: parseFloat(latitude),
        long: parseFloat(longitude),
        officeTag: officeTag || "Unknown Location",
      };
      attendance.totalBreakDuration = 0;
      
      // 🆕 Update late mark fields
      attendance.lateFlag = lateMarkData.lateFlag;
      attendance.lateMinutes = lateMarkData.lateMinutes;
      attendance.shiftStartTime = lateMarkData.shiftStartTime;
      attendance.gracePeriodMinutes = lateMarkData.gracePeriodMinutes;
      attendance.expectedClockInTime = lateMarkData.expectedClockInTime;
      
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        employeeId,
        date: today,
        clockInTime: clockInTime,
        status: "CHECKED_IN",
        workDuration: 0,
        totalBreakDuration: 0,
        photoReference,
        location: {
          lat: parseFloat(latitude),
          long: parseFloat(longitude),
          officeTag: officeTag || "Unknown Location",
        },
        // 🆕 Late mark fields
        lateFlag: lateMarkData.lateFlag,
        lateMinutes: lateMarkData.lateMinutes,
        shiftStartTime: lateMarkData.shiftStartTime,
        gracePeriodMinutes: lateMarkData.gracePeriodMinutes,
        expectedClockInTime: lateMarkData.expectedClockInTime,
      });
    }

    // 4️⃣ Emit real-time update
    const io = req.app.get("io");
    if (io) io.emit("attendance:update", { employeeId });

    return res.status(201).json({
      message: "Clock-in successful",
      data: {
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        status: attendance.status,
        workDuration: attendance.workDuration,
        totalBreakDuration: attendance.totalBreakDuration,
        photoReference: attendance.photoReference,
        location: attendance.location,
        // 🆕 Include late mark info in response
        lateFlag: attendance.lateFlag,
        lateMinutes: attendance.lateMinutes,
        lateStatus: attendance.lateFlag 
          ? `Late by ${attendance.lateMinutes} minutes` 
          : "On time",
      },
    });
  } catch (error) {
    console.error("Clock In Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/**
 * =========================
 * CLOCK OUT
 * =========================
 */
exports.clockOut = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();
    const { latitude, longitude, officeTag } = req.body;

    // Get uploaded photo path
    const photoReference = req.file ? `/api/uploads/attendance/${req.file.filename}` : null;

    const attendance = await Attendance.findOne({ employeeId, date: today });
    if (!attendance || (attendance.status !== "CHECKED_IN" && attendance.status !== "ON_BREAK")) {
      return res.status(400).json({ message: "You must be checked in before clocking out" });
    }

    // Ensure no active break
    const activeBreak = await Break.findOne({ attendanceId: attendance._id, isActive: true });
    if (activeBreak) {
      return res.status(400).json({ message: "Please end break before clocking out" });
    }

    const clockOutTime = new Date();
    const totalWorkMinutes = Math.floor((clockOutTime - attendance.clockInTime) / 60000);

    // Total break duration
    const breaks = await Break.find({ attendanceId: attendance._id });
    const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);

    const netWorkingMinutes = Math.max(0, totalWorkMinutes - totalBreakMinutes);

    const STANDARD_MINUTES = 480;
    const overtimeMinutes = Math.max(0, netWorkingMinutes - STANDARD_MINUTES);

    // Update attendance with clock-out photo if provided
    attendance.clockOutTime = clockOutTime;
    attendance.status = "CHECKED_OUT";
    attendance.workDuration = netWorkingMinutes;
    attendance.totalBreakDuration = totalBreakMinutes;
    
    // Update photo only if new one is provided
    if (photoReference) {
      attendance.photoReference = photoReference;
    }

    // Update location if provided
    if (latitude && longitude) {
      attendance.location = {
        lat: parseFloat(latitude),
        long: parseFloat(longitude),
        officeTag: officeTag || attendance.location?.officeTag || "Unknown Location",
      };
    }

    await attendance.save();

    const io = req.app.get("io");
    if (io) io.emit("attendance:update", { employeeId });

    return res.status(200).json({
      message: "Clock-out successful",
      data: {
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        totalWorkDuration: totalWorkMinutes,
        totalBreakDuration: totalBreakMinutes,
        netWorkingMinutes: netWorkingMinutes,
        netWorkingHours: (netWorkingMinutes / 60).toFixed(2),
        overtimeHours: (overtimeMinutes / 60).toFixed(2),
        status: attendance.status,
        photoReference: attendance.photoReference,
        location: attendance.location,
      },
    });
  } catch (error) {
    console.error("Clock Out Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/**
 * =========================
 * START BREAK
 * =========================
 */
exports.startBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();
    const { reason } = req.body;

    const attendance = await Attendance.findOne({ employeeId, date: today });
    if (!attendance || attendance.status !== "CHECKED_IN") {
      return res.status(400).json({ message: "You must be checked in to start a break" });
    }

    const activeBreak = await Break.findOne({ attendanceId: attendance._id, isActive: true });
    if (activeBreak) return res.status(400).json({ message: "Break already active" });

    const newBreak = await Break.create({
      attendanceId: attendance._id,
      employeeId,
      breakStart: new Date(),
      reason,
      isActive: true,
    });

    attendance.status = "ON_BREAK";
    await attendance.save();

    const io = req.app.get("io");
    if (io) io.emit("attendance:update", { employeeId });

    return res.status(201).json({
      message: "Break started",
      data: {
        status: attendance.status,
        breakStartTime: newBreak.breakStart,
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        totalBreakDuration: attendance.totalBreakDuration,
      },
    });
  } catch (error) {
    console.error("Start Break Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * END BREAK
 * =========================
 */
exports.endBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();

    const activeBreak = await Break.findOne({ employeeId, isActive: true }).sort({ breakStart: -1 });
    if (!activeBreak) return res.status(400).json({ message: "No active break found" });

    const endTime = new Date();
    const duration = Math.floor((endTime - activeBreak.breakStart) / 60000);

    activeBreak.breakEnd = endTime;
    activeBreak.breakDuration = duration;
    activeBreak.isActive = false;
    await activeBreak.save();

    const attendance = await Attendance.findById(activeBreak.attendanceId);
    attendance.status = "CHECKED_IN";
    attendance.totalBreakDuration += duration;
    await attendance.save();

    const io = req.app.get("io");
    if (io) io.emit("attendance:update", { employeeId });

    return res.status(200).json({
      message: "Break ended",
      data: {
        breakDuration: duration,
        status: attendance.status,
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        totalBreakDuration: attendance.totalBreakDuration,
      },
    });
  } catch (error) {
    console.error("End Break Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * =========================
 * LIVE ATTENDANCE STATUS
 * =========================
 */
exports.getLiveAttendanceStatus = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();
    const now = new Date();

    // Check for approved leave
    const leave = await Leave.findOne({ employeeId, date: today, status: "APPROVED" });
    if (leave) {
      return res.json({
        status: "ON_LEAVE",
        clockInTime: null,
        clockOutTime: null,
        runningWorkDuration: 0,
        totalBreakDuration: 0,
        currentBreakDuration: 0,
      });
    }

    // Check for attendance record
    const attendance = await Attendance.findOne({ employeeId, date: today });
    
    if (!attendance) {
      return res.json({
        status: null,
        clockInTime: null,
        clockOutTime: null,
        runningWorkDuration: 0,
        totalBreakDuration: 0,
        currentBreakDuration: 0,
      });
    }

    if (attendance.status === "CHECKED_OUT") {
      return res.json({
        status: "CHECKED_OUT",
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        runningWorkDuration: attendance.workDuration,
        totalBreakDuration: attendance.totalBreakDuration,
        currentBreakDuration: 0,
        photoReference: attendance.photoReference,
        location: attendance.location,
        // 🆕 Include late mark info
        lateFlag: attendance.lateFlag,
        lateMinutes: attendance.lateMinutes,
      });
    }

    // Calculate break time
    const breaks = await Break.find({ attendanceId: attendance._id });
    let totalBreakMinutes = 0;
    let currentBreakDuration = 0;

    breaks.forEach((b) => {
      if (b.breakStart && b.breakEnd) {
        totalBreakMinutes += Math.floor((b.breakEnd - b.breakStart) / 60000);
      }
      if (b.isActive) {
        currentBreakDuration = Math.floor((now - b.breakStart) / 60000);
        totalBreakMinutes += currentBreakDuration;
      }
    });

    const workedMinutes = Math.floor((now - attendance.clockInTime) / 60000);
    const runningWorkDuration = Math.max(0, workedMinutes - totalBreakMinutes);

    return res.json({
      status: attendance.status,
      clockInTime: attendance.clockInTime,
      clockOutTime: attendance.clockOutTime,
      runningWorkDuration,
      totalBreakDuration: totalBreakMinutes,
      currentBreakDuration,
      photoReference: attendance.photoReference,
      location: attendance.location,
      // 🆕 Include late mark info
      lateFlag: attendance.lateFlag,
      lateMinutes: attendance.lateMinutes,
    });
  } catch (error) {
    console.error("Live Status Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};