const Attendance = require("../models/Attendance.model");
const Leave = require("../models/Leave.model");
// const Break = require("../models/Break.model");
const { getTodayDate } = require("../utils/date.util");

// ============================================
// 🆕 LATE MARK CALCULATION UTILITY
// ============================================
const calculateLateMark = (clockInTime, shiftStartTime = "10:00", gracePeriodMinutes = 15) => {
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

    const photoReference = req.file ? `/api/uploads/attendance/${req.file.filename}` : null;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required for clock-in" });
    }

    // ✅ 1️⃣ AUTO-CLOSE OLD INCOMPLETE SESSIONS
    const oldIncompleteSessions = await Attendance.find({
      employeeId,
      date: { $lt: today }, // Any date before today
      status: { $in: ["CHECKED_IN", "ON_BREAK"] } // Still active
    });

    if (oldIncompleteSessions.length > 0) {
      console.log(`🔄 Found ${oldIncompleteSessions.length} incomplete session(s) to auto-close`);
      
      for (const oldSession of oldIncompleteSessions) {
        console.log(`⏰ Auto-closing session from ${oldSession.date}`);
        
        // Set clock out to midnight (11:59:59 PM) of that day
        const endOfDay = new Date(oldSession.date + "T23:59:59");
        
        const clockInTime = new Date(oldSession.clockIn.time);
        const totalWorkMinutes = Math.floor((endOfDay - clockInTime) / 60000);
        
        // Calculate breaks
        const totalBreakMinutes = oldSession.breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);
        const netWorkingMinutes = Math.max(0, totalWorkMinutes - totalBreakMinutes);
        
        const STANDARD_MINUTES = 480;
        const overtimeMinutes = Math.max(0, netWorkingMinutes - STANDARD_MINUTES);
        
        // Calculate break summary
        const breakSummary = {
          totalBreaks: oldSession.breaks.length,
          totalBreakHours: parseFloat((totalBreakMinutes / 60).toFixed(2))
        };
        
        // Update old session
        oldSession.clockOut = {
          time: endOfDay,
          location: oldSession.clockIn.location, // Use same location as clock-in
          image: null,
          isEarlyExit: false,
          earlyBy: 0,
        };
        oldSession.status = "CHECKED_OUT";
        oldSession.workDuration = totalWorkMinutes;
        oldSession.netWorkMinutes = netWorkingMinutes;
        oldSession.netWorkHours = parseFloat((netWorkingMinutes / 60).toFixed(2));
        oldSession.totalBreakDuration = totalBreakMinutes;
        oldSession.overtimeMinutes = overtimeMinutes;
        oldSession.overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));
        oldSession.breakSummary = breakSummary;
        
        await oldSession.save();
        
        console.log(`✅ Auto-closed session: ${oldSession.date} (Work: ${oldSession.netWorkHours}h)`);
      }
    }

    // 2️⃣ Check approved leave
    const leave = await Leave.findOne({ employeeId, date: today, status: "APPROVED" });
    if (leave) {
      return res.status(400).json({ message: "You are on approved leave today" });
    }

    // 3️⃣ Check attendance for today
    let attendance = await Attendance.findOne({ employeeId, date: today });

    const clockInTime = new Date();

    // 4️⃣ CALCULATE LATE MARK
    const lateMarkData = calculateLateMark(clockInTime, "10:00", 15);

    if (attendance) {
      if (attendance.status === "CHECKED_IN" || attendance.status === "ON_BREAK") {
        return res.status(400).json({ message: "Already clocked in" });
      }
      
      // ✅ Update with NEW STRUCTURE
      attendance.clockIn = {
        time: clockInTime,
        location: {
          lat: parseFloat(latitude),
          long: parseFloat(longitude),
          officeTag: officeTag || "Unknown Location",
        },
        image: photoReference,
        isLate: lateMarkData.lateFlag || false,
        lateBy: lateMarkData.lateMinutes || 0,
        expectedTime: lateMarkData.expectedClockInTime || null,
      };
      attendance.clockOut = null; // Reset clock out
      attendance.status = "CHECKED_IN";
      attendance.workDuration = 0;
      attendance.totalBreakDuration = 0;
      attendance.netWorkMinutes = 0;
      attendance.netWorkHours = 0;
      attendance.overtimeMinutes = 0;
      attendance.overtimeHours = 0;
      attendance.lateFlag = lateMarkData.lateFlag || false;
      attendance.lateMinutes = lateMarkData.lateMinutes || 0;
      attendance.shiftStartTime = lateMarkData.shiftStartTime || "10:00";

      await attendance.save();
    } else {
      // ✅ Create with NEW STRUCTURE
      attendance = await Attendance.create({
        employeeId,
        date: today,
        clockIn: {
          time: clockInTime,
          location: {
            lat: parseFloat(latitude),
            long: parseFloat(longitude),
            officeTag: officeTag || "Unknown Location",
          },
          image: photoReference,
          isLate: lateMarkData.lateFlag || false,
          lateBy: lateMarkData.lateMinutes || 0,
          expectedTime: lateMarkData.expectedClockInTime || null,
        },
        status: "CHECKED_IN",
        workDuration: 0,
        totalBreakDuration: 0,
        netWorkMinutes: 0,
        netWorkHours: 0,
        overtimeMinutes: 0,
        overtimeHours: 0,
        lateFlag: lateMarkData.lateFlag || false,
        lateMinutes: lateMarkData.lateMinutes || 0,
        shiftStartTime: lateMarkData.shiftStartTime || "10:00",
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("attendance:update", { employeeId });

    return res.status(201).json({
      message: "Clock-in successful",
      data: {
        clockInTime: attendance.clockIn?.time,
        clockOutTime: attendance.clockOut?.time,
        status: attendance.status,
        workDuration: attendance.workDuration,
        totalBreakDuration: attendance.totalBreakDuration,
        photoReference: attendance.clockIn?.image,
        location: attendance.clockIn?.location,
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

    const photoReference = req.file ? `/api/uploads/attendance/${req.file.filename}` : null;

    const attendance = await Attendance.findOne({ employeeId, date: today });
    
    if (!attendance || (attendance.status !== "CHECKED_IN" && attendance.status !== "ON_BREAK")) {
      return res.status(400).json({ message: "You must be checked in before clocking out" });
    }

    if (!attendance.clockIn || !attendance.clockIn.time) {
      console.error("❌ clockIn.time is missing:", attendance);
      return res.status(400).json({ 
        message: "Clock-in time is missing. Please clock in again.",
        action: "RECLOCKING_REQUIRED"
      });
    }

    // ✅ Check if there's an active break
    const activeBreak = attendance.breaks.find(b => b.isActive === true);
    if (activeBreak) {
      return res.status(400).json({ message: "Please end break before clocking out" });
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(attendance.clockIn.time);
    
    if (isNaN(clockInTime.getTime())) {
      console.error("❌ Invalid date:", attendance.clockIn.time);
      return res.status(400).json({ 
        message: "Invalid clock-in time detected." 
      });
    }

    const timeDiff = clockOutTime.getTime() - clockInTime.getTime();
    
    if (timeDiff < 0) {
      return res.status(400).json({ 
        message: "Clock-out time cannot be before clock-in time" 
      });
    }

    const totalWorkMinutes = Math.floor(timeDiff / 60000);

    // ✅ Calculate total break duration from breaks array
    const totalBreakMinutes = attendance.breaks.reduce((sum, b) => {
      return sum + (b.breakDuration || 0);
    }, 0);

    // ✅ Calculate break summary
    const breakSummary = {
      totalBreaks: attendance.breaks.length,
      totalBreakHours: parseFloat((totalBreakMinutes / 60).toFixed(2))
    };

    const netWorkingMinutes = Math.max(0, totalWorkMinutes - totalBreakMinutes);

    const STANDARD_MINUTES = 480; // 8 hours
    const overtimeMinutes = Math.max(0, netWorkingMinutes - STANDARD_MINUTES);

    // ✅ UPDATE ATTENDANCE DOCUMENT
    attendance.clockOut = {
      time: clockOutTime,
      location: {
        lat: parseFloat(latitude),
        long: parseFloat(longitude),
        officeTag: officeTag || attendance.clockIn?.location?.officeTag || "Unknown Location",
      },
      image: photoReference,
      isEarlyExit: false,
      earlyBy: 0,
    };
    
    attendance.status = "CHECKED_OUT";
    attendance.workDuration = totalWorkMinutes;
    attendance.netWorkMinutes = netWorkingMinutes;
    attendance.netWorkHours = parseFloat((netWorkingMinutes / 60).toFixed(2));
    attendance.totalBreakDuration = totalBreakMinutes;
    attendance.overtimeMinutes = overtimeMinutes;
    attendance.overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));
    attendance.breakSummary = breakSummary;

    await attendance.save();

    // ✅ Emit socket event
    const io = req.app.get("io");
    if (io) io.emit("attendance:update", { employeeId });

    // ✅ IMPORTANT: Return the saved attendance data, not calculated values
    return res.status(200).json({
      message: "Clock-out successful",
      data: {
        status: attendance.status,
        clockInTime: attendance.clockIn.time,
        clockOutTime: attendance.clockOut.time,
        netWorkHours: attendance.netWorkHours, // ✅ This matches frontend
        netWorkMinutes: attendance.netWorkMinutes,
        workDuration: attendance.workDuration,
        totalBreakDuration: attendance.totalBreakDuration,
        overtimeMinutes: attendance.overtimeMinutes,
        overtimeHours: attendance.overtimeHours,
        breakSummary: attendance.breakSummary, // ✅ Required by frontend
      },
    });
  } catch (error) {
    console.error("Clock Out Error:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

// ============================================
// 🔹 BREAK START (Fixed to match Break model schema)
// ============================================
exports.startBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();
    const { reason } = req.body;

    console.log("🔍 Start Break Debug:", { employeeId, today });

    const attendance = await Attendance.findOne({ employeeId, date: today });

    console.log("📋 Found Attendance:", attendance);

    if (!attendance) {
      return res.status(400).json({
        message: "No attendance record found. Please clock in first.",
      });
    }

    if (attendance.status !== "CHECKED_IN") {
      return res.status(400).json({
        message: `Cannot start break. Current status: ${attendance.status}. You must be checked in.`,
      });
    }

    // ✅ Check if there's already an active break in the breaks array
    const existingBreak = attendance.breaks.find(b => b.isActive === true);

    console.log("🔍 Existing Active Break:", existingBreak);

    if (existingBreak) {
      return res.status(400).json({ message: "Break already active" });
    }

    // ✅ Add new break to the breaks array
    attendance.breaks.push({
      breakStart: new Date(),
      reason: reason || "General Break",
      isActive: true,
    });

    attendance.status = "ON_BREAK";
    await attendance.save();

    console.log("✅ Break started and added to attendance.breaks array");

    const io = req.app.get("io");
    if (io) {
      io.emit("attendance:update", { employeeId });
      console.log("📡 Emitted attendance:update event");
    }

    return res.status(200).json({
      message: "Break started",
      data: {
        status: attendance.status,
        clockInTime: attendance.clockIn?.time || null,
        clockOutTime: attendance.clockOut?.time || null,
        totalBreakDuration: attendance.totalBreakDuration || 0,
      },
    });
  } catch (error) {
    console.error("❌ Start Break Error:", error);
    console.error("Error Stack:", error.stack);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// ============================================
// 🔹 BREAK END (Fixed to match Break model schema)
// ============================================
exports.endBreak = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = getTodayDate();

    console.log("🔍 End Break Debug:", { employeeId, today });

    const attendance = await Attendance.findOne({ employeeId, date: today });

    console.log("📋 Found Attendance:", attendance);

    if (!attendance) {
      return res.status(400).json({ message: "No attendance record found" });
    }

    if (attendance.status !== "ON_BREAK") {
      return res.status(400).json({
        message: `Cannot end break. Current status: ${attendance.status}. No active break to end.`,
      });
    }

    // ✅ Find the active break in the breaks array
    const activeBreak = attendance.breaks.find(b => b.isActive === true);

    console.log("🔍 Active Break:", activeBreak);

    if (!activeBreak) {
      console.log("⚠️ No active break found, correcting status to CHECKED_IN");
      attendance.status = "CHECKED_IN";
      await attendance.save();
      return res.status(400).json({
        message: "No active break found. Status corrected to CHECKED_IN.",
      });
    }

    const endTime = new Date();
    const breakDuration = Math.floor((endTime - activeBreak.breakStart) / 60000);

    console.log("⏱️ Break Duration:", {
      breakStart: activeBreak.breakStart,
      breakEnd: endTime,
      durationMinutes: breakDuration,
    });

    // ✅ Update the active break
    activeBreak.breakEnd = endTime;
    activeBreak.breakDuration = breakDuration;
    activeBreak.isActive = false;

    console.log("✅ Break ended");

    // ✅ Recalculate total break duration from all breaks
    const totalBreakDuration = attendance.breaks.reduce(
      (sum, b) => sum + (b.breakDuration || 0), 
      0
    );

    console.log("📊 Total Break Duration:", totalBreakDuration, "minutes");

    attendance.totalBreakDuration = totalBreakDuration;
    attendance.breakSummary.totalBreaks = attendance.breaks.filter(b => !b.isActive).length;
    attendance.breakSummary.totalBreakHours = parseFloat((totalBreakDuration / 60).toFixed(2));
    attendance.status = "CHECKED_IN";
    
    await attendance.save();

    console.log("✅ Attendance status updated to CHECKED_IN");

    const io = req.app.get("io");
    if (io) {
      io.emit("attendance:update", { employeeId });
      console.log("📡 Emitted attendance:update event");
    }

    return res.status(200).json({
      message: "Break ended",
      data: {
        status: attendance.status,
        clockInTime: attendance.clockIn?.time || null,
        clockOutTime: attendance.clockOut?.time || null,
        totalBreakDuration: attendance.totalBreakDuration || 0,
        breakSummary: attendance.breakSummary,
      },
    });
  } catch (error) {
    console.error("❌ End Break Error:", error);
    console.error("Error Stack:", error.stack);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    const attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) {
      return res.status(200).json({
        status: null,
        clockInTime: null,
        clockOutTime: null,
        totalBreakDuration: 0,
        currentBreakDuration: 0,
      });
    }

    // ✅ Get current active break if any
   const activeBreak = attendance.breaks.find(b => b.isActive === true);

    const currentBreakDuration = activeBreak
      ? Math.floor((new Date() - new Date(activeBreak.startTime)) / 60000)
      : 0;

    // ✅ RETURN WITH NEW STRUCTURE
    return res.status(200).json({
      status: attendance.status,
      clockInTime: attendance.clockIn?.time || null,  // ✅ Changed from attendance.clockInTime
      clockOutTime: attendance.clockOut?.time || null, // ✅ Changed from attendance.clockOutTime
      totalBreakDuration: attendance.totalBreakDuration || 0,
      currentBreakDuration: currentBreakDuration,
    });
  } catch (error) {
    console.error("Get Live Status Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};