const Attendance = require("../models/Attendance.model");
const Leave = require("../models/Leave.model");
const User = require("../models/User.model");
const Employee = require("../models/Employee.model");
const PayrollSetting = require("../models/PayrollSetting.model");
const { getTodayDate } = require("../utils/date.util");
const mongoose = require("mongoose");


/**
 * @desc    Get Daily Logs (Generic - Consider deprecating in favor of new endpoints)
 * @route   GET /api/v1/daily-logs
 * @access  Private
 */
exports.getDailyLogs = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const employeeId = req.user._id;

    let query = {};

    // ✅ Force employee to only see their own data
    if (userRole === "employee" || userRole === "sr_employee" || userRole === "jr_employee" || userRole === "intern") {
      query.employeeId = employeeId;
    }

    if (date) {
      query.date = date;
    } else {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      const fortyDaysAgoStr = fortyDaysAgo.toISOString().split('T')[0];
      query.date = { $gte: fortyDaysAgoStr };
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Attendance.find(query)
        .populate("employeeId", "name email employeeCode department")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Attendance.countDocuments(query),
    ]);

    const today = new Date().toISOString().split('T')[0];

    const processedLogs = await Promise.all(
      logs.map(async (log) => {
        const clockInTime = log.clockIn?.time ?? log.clockInTime ?? null;
        const clockOutTime = log.clockOut?.time ?? log.clockOutTime ?? null;

        const isToday = log.date === today;

        let netWorkMinutes = log.netWorkMinutes;
        let netWorkHours = log.netWorkHours;
        let overtimeMinutes = log.overtimeMinutes || 0;
        let overtimeHours = log.overtimeHours || 0;
        let breakSummary = log.breakSummary;

        if ((!netWorkMinutes && !netWorkHours) && clockInTime) {
          const breaks = log.breaks || [];
          const totalBreakDuration = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);

          let endTime;

          if (clockOutTime) {
            endTime = clockOutTime;
          } else if (isToday && (log.status === "CHECKED_IN" || log.status === "ON_BREAK")) {
            endTime = new Date();
          } else {
            endTime = null;
          }

          if (endTime) {
            const totalMinutes = Math.floor(
              (new Date(endTime) - new Date(clockInTime)) / 60000
            );
            netWorkMinutes = Math.max(0, totalMinutes - totalBreakDuration);
            netWorkHours = parseFloat((netWorkMinutes / 60).toFixed(2));

            const STANDARD_WORK_HOURS = 8 * 60;
            overtimeMinutes = Math.max(0, netWorkMinutes - STANDARD_WORK_HOURS);
            overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));
          } else {
            netWorkMinutes = 0;
            netWorkHours = 0;
          }

          if (!breakSummary) {
            breakSummary = {
              totalBreaks: breaks.length,
              totalBreakDuration: totalBreakDuration,
              totalBreakHours: parseFloat((totalBreakDuration / 60).toFixed(2)),
            };
          }
        }

        if (!breakSummary) {
          const breaks = log.breaks || [];
          const totalBreakDuration = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);
          breakSummary = {
            totalBreaks: breaks.length,
            totalBreakDuration: totalBreakDuration,
            totalBreakHours: parseFloat((totalBreakDuration / 60).toFixed(2)),
          };
        }

        const deductions = await calculateDeductions(log, log.breaks || []);

        return {
          _id: log._id.toString(),
          date: log.date,

          clockInTime: clockInTime,
          clockOutTime: clockOutTime,

          employeeInfo: log.employeeId ? {
            name: log.employeeId.name,
            email: log.employeeId.email,
            employeeCode: log.employeeId.employeeCode,
            department: log.employeeId.department,
          } : null,

          breakSummary: {
            totalBreaks: breakSummary.totalBreaks || 0,
            totalBreakDuration: breakSummary.totalBreakDuration || 0,
            totalBreakHours: parseFloat(breakSummary.totalBreakHours || 0).toFixed(2),
          },

          netWorkMinutes: netWorkMinutes || 0,
          netWorkHours: parseFloat(netWorkHours || 0).toFixed(2),

          overtimeMinutes: overtimeMinutes,
          overtimeHours: parseFloat(overtimeHours).toFixed(2),

          lateFlag: log.lateFlag || deductions.lateMinutes > 0,
          lateMinutes: log.lateMinutes || deductions.lateMinutes,
          lateDeduction: log.lateDeduction || deductions.lateDeduction,
          shiftStartTime: log.shiftStartTime || "10:00",

          earlyExitFlag: log.earlyExitFlag || deductions.earlyExitMinutes > 0,
          earlyExitMinutes: log.earlyExitMinutes || deductions.earlyExitMinutes,
          earlyExitDeduction: log.earlyExitDeduction || deductions.earlyExitDeduction,

          absentDeduction: log.absentDeduction || deductions.absentDeduction,

          totalDeduction: log.totalDeduction || deductions.totalDeduction,
          deductionBreakdown: log.deductionBreakdown || deductions.deductionBreakdown,

          status: log.status,
          location: log.clockIn?.location || log.clockOut?.location || log.location || null,
          photoReference: log.clockIn?.image || log.clockOut?.image || log.photoReference || null,

          gracePeriodMinutes: log.gracePeriodMinutes || 15,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        logs: processedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Daily Logs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * =========================
 * CALCULATE DEDUCTIONS - HELPER FUNCTION
 * =========================
 */
async function calculateDeductions(attendance, breaks = []) {
  try {
    // Fetch active payroll settings
    const payroll = await PayrollSetting.getActiveSetting();

    if (!payroll) {
      console.error("⚠️ No active payroll setting found - using defaults");
      return {
        lateMinutes: 0,
        lateDeduction: 0,
        earlyExitMinutes: 0,
        earlyExitDeduction: 0,
        absentDeduction: 0,
        overtimeMinutes: 0,
        overtimeAmount: 0,
        totalDeduction: 0,
        deductionBreakdown: [],
      };
    }

    const deductionBreakdown = [];

    // ================= CALCULATE BREAK DURATION =================
    const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);

    // ================= GET CLOCK TIMES =================
    const clockInTime = attendance.clockIn?.time || attendance.clockInTime;
    const clockOutTime = attendance.clockOut?.time || attendance.clockOutTime;

    // ================= CALCULATE WORK DURATION =================
    let totalWorkMinutes = 0;
    if (clockInTime && clockOutTime) {
      const totalMinutes = Math.floor(
        (new Date(clockOutTime) - new Date(clockInTime)) / 60000
      );
      totalWorkMinutes = Math.max(0, totalMinutes - totalBreakMinutes);
    }

    // ================= LATE ARRIVAL - TIERED PENALTY =================
    let lateMinutes = 0;
    let lateDeduction = 0;

    if (clockInTime) {
      const shiftStart = attendance.shiftStartTime || "09:00";
      const [hours, minutes] = shiftStart.split(":").map(Number);
      const expectedClockIn = new Date(clockInTime);
      expectedClockIn.setHours(hours, minutes, 0, 0);

      const timeDiffMinutes = Math.floor(
        (new Date(clockInTime) - expectedClockIn) / 60000
      );

      const grace = payroll.lateGracePeriodMinutes || 30;
      
      if (timeDiffMinutes > grace) {
        lateMinutes = timeDiffMinutes;
        const effectiveLate = timeDiffMinutes - grace;

        // 🆕 TIERED LATE PENALTIES
        if (effectiveLate >= 90) {
          // 1.5+ hours late
          lateDeduction = payroll.latePenalties?.after1AndHalfHours || 250;
          deductionBreakdown.push({
            type: "LATE",
            minutes: lateMinutes,
            amount: lateDeduction,
            description: `Late by ${Math.floor(lateMinutes / 60)}h ${lateMinutes % 60}m (≥1.5 hours) - ₹${lateDeduction}`,
          });
        } else if (effectiveLate >= 60) {
          // 1-1.5 hours late
          lateDeduction = payroll.latePenalties?.after1Hour || 200;
          deductionBreakdown.push({
            type: "LATE",
            minutes: lateMinutes,
            amount: lateDeduction,
            description: `Late by ${Math.floor(lateMinutes / 60)}h ${lateMinutes % 60}m (≥1 hour) - ₹${lateDeduction}`,
          });
        } else if (effectiveLate > 0) {
          // 30min-1hour late
          lateDeduction = payroll.latePenalties?.after30Minutes || 100;
          deductionBreakdown.push({
            type: "LATE",
            minutes: lateMinutes,
            amount: lateDeduction,
            description: `Late by ${Math.floor(lateMinutes / 60)}h ${lateMinutes % 60}m (>30 min) - ₹${lateDeduction}`,
          });
        }
      }
    }

    // ================= EARLY EXIT PENALTY =================
    let earlyExitMinutes = 0;
    let earlyExitDeduction = 0;

    if (clockInTime && clockOutTime) {
      const expectedShiftEnd = new Date(clockInTime);
      expectedShiftEnd.setMinutes(
        expectedShiftEnd.getMinutes() + (payroll.standardShiftMinutes || 480)
      );

      const timeDiffMinutes = Math.floor(
        (expectedShiftEnd - new Date(clockOutTime)) / 60000
      );

      const grace = payroll.earlyExitGraceMinutes || 15;
      earlyExitMinutes = Math.max(0, timeDiffMinutes - grace);

      if (earlyExitMinutes > 0) {
        earlyExitDeduction = earlyExitMinutes * (payroll.earlyExitPenaltyPerMinute || 15);
        deductionBreakdown.push({
          type: "EARLY_EXIT",
          minutes: earlyExitMinutes,
          amount: earlyExitDeduction,
          description: `Early exit by ${earlyExitMinutes} min (₹${payroll.earlyExitPenaltyPerMinute}/min after ${grace} min grace)`,
        });
      }
    }

    // ================= EXCESS BREAK PENALTY =================
    const maxBreak = payroll.maxBreakMinutes || 60;
    if (totalBreakMinutes > maxBreak) {
      const excessMinutes = totalBreakMinutes - maxBreak;
      const breakPenaltyRate = payroll.excessBreakPenaltyPerMinute || 10;
      const breakPenalty = excessMinutes * breakPenaltyRate;
      
      deductionBreakdown.push({
        type: "EXCESS_BREAK",
        minutes: excessMinutes,
        amount: breakPenalty,
        description: `Excess break ${excessMinutes} min (₹${breakPenaltyRate}/min beyond ${maxBreak} min)`,
      });
    }

    // ================= ABSENT/HALF-DAY PENALTY =================
    let absentDeduction = 0;

    if (!clockInTime) {
      absentDeduction = payroll.absentFullDayPenalty || 1000;
      deductionBreakdown.push({
        type: "ABSENT",
        amount: absentDeduction,
        description: "Full day absent",
      });
    } else if (clockOutTime && totalWorkMinutes < (payroll.halfDayThresholdMinutes || 240)) {
      absentDeduction = payroll.halfDayPenalty || 500;
      deductionBreakdown.push({
        type: "HALF_DAY_ABSENT",
        amount: absentDeduction,
        workMinutes: totalWorkMinutes,
        description: `Worked ${(totalWorkMinutes / 60).toFixed(2)}h (< 4h threshold) - Half day penalty`,
      });
    }

    // ================= OVERTIME - TIERED BONUS =================
    let overtimeMinutes = 0;
    let overtimeAmount = 0;

    if (totalWorkMinutes > (payroll.standardShiftMinutes || 480)) {
      overtimeMinutes = totalWorkMinutes - (payroll.standardShiftMinutes || 480);
      const overtimeHours = overtimeMinutes / 60;

      // 🆕 TIERED OVERTIME BONUSES
      if (overtimeHours >= 4) {
        overtimeAmount = payroll.overtimeBonuses?.after4Hours || 450;
      } else if (overtimeHours >= 3) {
        overtimeAmount = payroll.overtimeBonuses?.after3Hours || 350;
      } else if (overtimeHours >= 2) {
        overtimeAmount = payroll.overtimeBonuses?.after2Hours || 250;
      } else if (overtimeHours >= 1) {
        overtimeAmount = payroll.overtimeBonuses?.after1Hour || 150;
      }
    }

    // ================= TOTAL DEDUCTION =================
    const totalPenalty = deductionBreakdown
      .filter(d => d.type !== 'OVERTIME')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const totalDeduction = totalPenalty;

    return {
      lateMinutes,
      lateDeduction,
      earlyExitMinutes,
      earlyExitDeduction,
      absentDeduction,
      overtimeMinutes,
      overtimeAmount,
      totalDeduction,
      totalPenalty,
      deductionBreakdown,
      netWorkMinutes: totalWorkMinutes,
    };
  } catch (error) {
    console.error("❌ Error calculating deductions:", error);
    return {
      lateMinutes: 0,
      lateDeduction: 0,
      earlyExitMinutes: 0,
      earlyExitDeduction: 0,
      absentDeduction: 0,
      overtimeMinutes: 0,
      overtimeAmount: 0,
      totalDeduction: 0,
      deductionBreakdown: [],
    };
  }
}


/**
 * =========================
 * PROCESS SINGLE DAILY LOG ROW (Updated for Embedded Breaks)
 * =========================
 */
async function processDailyLogRow(attendance, userRole) {
  const breaks = attendance.breaks || [];
  const totalBreaks = breaks.length;
  const totalBreakDuration = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);

  const clockInTime = attendance.clockIn?.time || attendance.clockInTime;
  const clockOutTime = attendance.clockOut?.time || attendance.clockOutTime;

  // ✅ Use saved values if available
  let netWorkMinutes = attendance.netWorkMinutes || 0;
  let netWorkHours = attendance.netWorkHours || 0;
  let overtimeMinutes = attendance.overtimeMinutes || 0;
  let overtimeHours = attendance.overtimeHours || 0;

  // Calculate if not saved
  if (!netWorkMinutes && !netWorkHours && clockInTime && clockOutTime) {
    const totalMinutes = Math.floor(
      (new Date(clockOutTime) - new Date(clockInTime)) / 60000
    );
    netWorkMinutes = Math.max(0, totalMinutes - totalBreakDuration);
    netWorkHours = parseFloat((netWorkMinutes / 60).toFixed(2));

    const STANDARD_WORK_HOURS = 8 * 60;
    overtimeMinutes = Math.max(0, netWorkMinutes - STANDARD_WORK_HOURS);
    overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));
  }

  const deductionDetails = await calculateDeductions(attendance, breaks);

  const logRow = {
    _id: attendance._id.toString(),
    date: attendance.date,
    clockInTime: clockInTime,
    clockOutTime: clockOutTime,
    netWorkMinutes,
    netWorkHours: netWorkHours.toFixed(2),

    // Deductions
    lateMinutes: attendance.lateMinutes || deductionDetails.lateMinutes,
    lateDeduction: attendance.lateDeduction || deductionDetails.lateDeduction,
    earlyExitMinutes: attendance.earlyExitMinutes || deductionDetails.earlyExitMinutes,
    earlyExitDeduction: attendance.earlyExitDeduction || deductionDetails.earlyExitDeduction,
    absentDeduction: attendance.absentDeduction || deductionDetails.absentDeduction,
    totalDeduction: attendance.totalDeduction || deductionDetails.totalDeduction,

    // Flags
    lateFlag: attendance.lateFlag || deductionDetails.lateMinutes > 0,
    earlyExitFlag: attendance.earlyExitFlag || deductionDetails.earlyExitMinutes > 0,

    shiftStartTime: attendance.shiftStartTime || "10:00",
    gracePeriodMinutes: attendance.gracePeriodMinutes || 15,
    overtimeHours: overtimeHours.toFixed(2),
    overtimeMinutes: overtimeMinutes,
    overtimeAmount: deductionDetails.overtimeAmount || 0,

    breakSummary: {
      totalBreaks,
      totalBreakDuration,
      totalBreakHours: (totalBreakDuration / 60).toFixed(2),
    },

    location: attendance.clockIn?.location || attendance.clockOut?.location || attendance.location,
    status: attendance.status,
    photoReference: attendance.clockIn?.image || attendance.clockOut?.image || attendance.photoReference,
  };

  if (userRole === "admin" || userRole === "super_admin" || userRole === "manager") {
    logRow.employeeInfo = attendance.employeeId ? {
      id: attendance.employeeId._id,
      name: attendance.employeeId.name,
      email: attendance.employeeId.email,
      employeeCode: attendance.employeeId.employeeCode,
      department: attendance.employeeId.department,
    } : null;
  }

  return logRow;
}

/**
 * =========================
 * GET DAILY LOG BY ID
 * =========================
 */
exports.getDailyLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    const attendance = await Attendance.findById(id).populate(
      "employeeId",
      "name email employeeCode department"
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // ✅ Enhanced permission check for all employee roles
    const employeeRoles = ["employee", "sr_employee", "jr_employee", "intern"];
    if (
      employeeRoles.includes(requestingUser.role) &&
      attendance.employeeId._id.toString() !== requestingUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this record",
      });
    }

    const logRow = await processDailyLogRow(attendance, requestingUser.role);

    return res.status(200).json({
      success: true,
      message: "Daily log retrieved successfully",
      data: logRow,
    });
  } catch (error) {
    console.error("Get Daily Log Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


/**
 * =========================
 * GET LATE EMPLOYEES REPORT
 * =========================
 */
exports.getLateEmployeesReport = async (req, res) => {
  try {
    const { date, page = 1, limit = 50 } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Find all attendances for the date
    const query = { date: targetDate };
    const skip = (page - 1) * limit;

    const attendances = await Attendance.find(query)
      .populate("employeeId", "name email employeeCode department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Process and filter late employees
    const lateReport = [];

    for (const attendance of attendances) {
      const breaks = attendance.breaks || [];
      const deductions = await calculateDeductions(attendance, breaks);

      if (deductions.lateMinutes > 0) {
        lateReport.push({
          employeeInfo: {
            id: attendance.employeeId._id,
            name: attendance.employeeId.name,
            email: attendance.employeeId.email,
            employeeCode: attendance.employeeId.employeeCode,
            department: attendance.employeeId.department,
          },
          clockInTime: attendance.clockIn?.time || attendance.clockInTime,
          expectedClockInTime: attendance.shiftStartTime || "10:00",
          lateMinutes: deductions.lateMinutes,
          shiftStartTime: attendance.shiftStartTime || "10:00",
          gracePeriodMinutes: attendance.gracePeriodMinutes || 15,
          location: attendance.clockIn?.location || attendance.location,
          deduction: deductions.lateDeduction,
        });
      }
    }

    // Sort by most late first
    lateReport.sort((a, b) => b.lateMinutes - a.lateMinutes);

    const total = lateReport.length;

    return res.status(200).json({
      success: true,
      message: "Late employees report retrieved successfully",
      data: {
        date: targetDate,
        lateEmployees: lateReport,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Late Employees Report Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



/**
 * =========================
 * GET DAILY SUMMARY
 * =========================
 */
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const userRole = req.user.role;
    const employeeId = req.user._id;

    let query = {};

    // Role-based filtering
    const employeeRoles = ["employee", "sr_employee", "jr_employee", "intern"];
    if (employeeRoles.includes(userRole)) {
      query.employeeId = employeeId;
    }

    // Date filtering
    if (date) {
      query.date = date;
    } else {
      query.date = new Date().toISOString().split('T')[0];
    }

    const [
      totalEmployees,
      checkedIn,
      onBreak,
      checkedOut,
      leaves,
    ] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.countDocuments({ ...query, status: "CHECKED_IN" }),
      Attendance.countDocuments({ ...query, status: "ON_BREAK" }),
      Attendance.countDocuments({ ...query, status: "CHECKED_OUT" }),
      Attendance.countDocuments({ ...query, status: "ON_LEAVE" }),
    ]);

    const allAttendances = await Attendance.find(query).lean();
    let lateEmployees = 0;

    for (const att of allAttendances) {
      const breaks = att.breaks || [];
      const deductions = await calculateDeductions(att, breaks);
      if (deductions.lateMinutes > 0) {
        lateEmployees++;
      }
    }

    const present = checkedIn + onBreak + checkedOut;
    const notClockedIn = totalEmployees - present - leaves;

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        present,
        checkedIn,
        onBreak,
        checkedOut,
        leaves,
        lateEmployees,
        notClockedIn: Math.max(0, notClockedIn),
      },
    });
  } catch (error) {
    console.error("Get Daily Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * =========================
 * GET DEDUCTION SUMMARY (Updated for Embedded Breaks)
 * =========================
 */
exports.getDeductionSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const userRole = req.user.role;
    const employeeId = req.user._id;

    let query = {};

    // Role-based filtering
    if (userRole === "employee") {
      query.employeeId = employeeId;
    }

    // Date filtering
    if (date) {
      query.date = date;
    } else {
      // Today by default
      query.date = new Date().toISOString().split('T')[0];
    }

    console.log("📊 Fetching deduction summary with query:", query);

    const logs = await Attendance.find(query)
      .populate("employeeId", "name employeeCode department")
      .lean();

    console.log(`📝 Found ${logs.length} attendance records`);

    // ✅ Handle empty logs case
    if (!logs || logs.length === 0) {
      console.log("⚠️ No attendance records found for the given criteria");
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRecords: 0,
            uniqueEmployees: 0,
            lateCount: 0,
            earlyExitCount: 0,
            absentCount: 0,
            overtimeCount: 0,
            breakPenaltyCount: 0,
            grandTotalDeductions: 0,
            totalLateDeductions: 0,
            totalEarlyExitDeductions: 0,
            totalAbsentDeductions: 0,
            totalBreakPenalties: 0,
            totalOvertimeBonuses: 0,
          },
          deductionReports: [],
        },
      });
    }

    // ✅ Filter out logs without valid employee data
    const validLogs = logs.filter(log => {
      if (!log.employeeId) {
        console.warn(`⚠️ Log ${log._id} has no employeeId, skipping...`);
        return false;
      }
      return true;
    });

    console.log(`✅ Valid logs with employee data: ${validLogs.length}`);

    if (validLogs.length === 0) {
      console.log("⚠️ No valid logs with employee information found");
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRecords: 0,
            uniqueEmployees: 0,
            lateCount: 0,
            earlyExitCount: 0,
            absentCount: 0,
            overtimeCount: 0,
            breakPenaltyCount: 0,
            grandTotalDeductions: 0,
            totalLateDeductions: 0,
            totalEarlyExitDeductions: 0,
            totalAbsentDeductions: 0,
            totalBreakPenalties: 0,
            totalOvertimeBonuses: 0,
          },
          deductionReports: [],
        },
      });
    }

    // Process each log to calculate deductions
    const processedLogs = await Promise.all(
      validLogs.map(async (log) => {
        try {
          const breaks = log.breaks || [];
          
          // ✅ Use your existing calculateDeductions function
          let deductions;
          try {
            deductions = await calculateDeductions(log, breaks);
          } catch (deductionError) {
            console.error(`❌ Error calculating deductions for log ${log._id}:`, deductionError);
            // Return zero deductions if calculation fails
            deductions = {
              lateMinutes: 0,
              lateDeduction: 0,
              earlyExitMinutes: 0,
              earlyExitDeduction: 0,
              absentDeduction: 0,
              overtimeMinutes: 0,
              overtimeAmount: 0,
              totalDeduction: 0,
              deductionBreakdown: [],
            };
          }

          // ✅ Calculate net work hours
          const clockIn = log.clockIn?.time || log.clockInTime;
          const clockOut = log.clockOut?.time || log.clockOutTime;
          let netWorkHours = 0;

          if (clockIn && clockOut) {
            try {
              const totalMinutes = Math.floor((new Date(clockOut) - new Date(clockIn)) / (1000 * 60));
              const breakMinutes = breaks.reduce((sum, b) => {
                if (b.startTime && b.endTime) {
                  return sum + Math.floor((new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60));
                }
                return sum;
              }, 0);
              netWorkHours = ((totalMinutes - breakMinutes) / 60).toFixed(1);
            } catch (timeError) {
              console.error(`❌ Error calculating work hours for log ${log._id}:`, timeError);
              netWorkHours = 0;
            }
          }

          // ✅ Extract break penalties from deductionBreakdown
          let excessBreakMinutes = 0;
          let breakPenalty = 0;

          const breakDeduction = deductions.deductionBreakdown?.find(d => d.type === 'EXCESS_BREAK');
          if (breakDeduction) {
            excessBreakMinutes = breakDeduction.minutes || 0;
            breakPenalty = breakDeduction.amount || 0;
          }

          // ✅ Safely extract employee information
          const employeeInfo = {
            name: log.employeeId?.name || 'Unknown Employee',
            employeeCode: log.employeeId?.employeeCode || 'N/A',
            department: log.employeeId?.department || 'Unassigned',
          };

          console.log(`👤 Processing: ${employeeInfo.name} (${employeeInfo.employeeCode})`);

          return {
            date: log.date,
            employeeInfo,
            lateMinutes: deductions.lateMinutes || 0,
            lateDeduction: deductions.lateDeduction || 0,
            earlyExitMinutes: deductions.earlyExitMinutes || 0,
            earlyExitDeduction: deductions.earlyExitDeduction || 0,
            excessBreakMinutes,
            breakPenalty,
            absentDeduction: deductions.absentDeduction || 0,
            overtimeMinutes: deductions.overtimeMinutes || 0,
            overtimeBonus: deductions.overtimeAmount || 0,
            totalDeduction: deductions.totalDeduction || 0,
            netWorkHours: parseFloat(netWorkHours) || 0,
            clockInTime: clockIn,
            clockOutTime: clockOut,
          };
        } catch (logError) {
          console.error(`❌ Error processing log ${log._id}:`, logError);
          // Return a default object for this log
          return {
            date: log.date,
            employeeInfo: {
              name: log.employeeId?.name || 'Unknown Employee',
              employeeCode: log.employeeId?.employeeCode || 'N/A',
              department: log.employeeId?.department || 'Unassigned',
            },
            lateMinutes: 0,
            lateDeduction: 0,
            earlyExitMinutes: 0,
            earlyExitDeduction: 0,
            excessBreakMinutes: 0,
            breakPenalty: 0,
            absentDeduction: 0,
            overtimeMinutes: 0,
            overtimeBonus: 0,
            totalDeduction: 0,
            netWorkHours: 0,
            clockInTime: log.clockIn?.time || log.clockInTime,
            clockOutTime: log.clockOut?.time || log.clockOutTime,
          };
        }
      })
    );

    // ✅ Filter out any null or undefined results
    const validProcessedLogs = processedLogs.filter(log => log !== null && log !== undefined);

    // ✅ Calculate comprehensive statistics
    const totalRecords = validProcessedLogs.length;
    const uniqueEmployees = new Set(
      validProcessedLogs
        .map(log => log.employeeInfo?.employeeCode)
        .filter(code => code && code !== 'N/A')
    ).size;
    
    const lateCount = validProcessedLogs.filter(log => log.lateMinutes > 0).length;
    const earlyExitCount = validProcessedLogs.filter(log => log.earlyExitMinutes > 0).length;
    const absentCount = validProcessedLogs.filter(log => log.absentDeduction > 0).length;
    const overtimeCount = validProcessedLogs.filter(log => log.overtimeMinutes > 0).length;
    const breakPenaltyCount = validProcessedLogs.filter(log => log.breakPenalty > 0).length;

    const grandTotalDeductions = validProcessedLogs.reduce((sum, log) => sum + (log.totalDeduction || 0), 0);
    const totalLateDeductions = validProcessedLogs.reduce((sum, log) => sum + (log.lateDeduction || 0), 0);
    const totalEarlyExitDeductions = validProcessedLogs.reduce((sum, log) => sum + (log.earlyExitDeduction || 0), 0);
    const totalAbsentDeductions = validProcessedLogs.reduce((sum, log) => sum + (log.absentDeduction || 0), 0);
    const totalBreakPenalties = validProcessedLogs.reduce((sum, log) => sum + (log.breakPenalty || 0), 0);
    const totalOvertimeBonuses = validProcessedLogs.reduce((sum, log) => sum + (log.overtimeBonus || 0), 0);

    console.log("✅ Deduction summary calculated successfully");
    console.log(`📊 Total Records: ${totalRecords}, Unique Employees: ${uniqueEmployees}`);
    console.log(`💰 Grand Total Deductions: ₹${Math.round(grandTotalDeductions)}`);
    console.log(`🎁 Total Overtime Bonuses: ₹${Math.round(totalOvertimeBonuses)}`);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRecords,
          uniqueEmployees,
          lateCount,
          earlyExitCount,
          absentCount,
          overtimeCount,
          breakPenaltyCount,
          grandTotalDeductions: Math.round(grandTotalDeductions),
          totalLateDeductions: Math.round(totalLateDeductions),
          totalEarlyExitDeductions: Math.round(totalEarlyExitDeductions),
          totalAbsentDeductions: Math.round(totalAbsentDeductions),
          totalBreakPenalties: Math.round(totalBreakPenalties),
          totalOvertimeBonuses: Math.round(totalOvertimeBonuses),
        },
        deductionReports: validProcessedLogs,
      },
    });
  } catch (error) {
    console.error("❌ Get Deduction Summary Error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    // ✅ Log more details for debugging
    if (error.name === 'CastError') {
      console.error("❌ Database casting error - check data types");
      console.error("Path:", error.path);
      console.error("Value:", error.value);
    }
    
    if (error.name === 'ValidationError') {
      console.error("❌ Validation error:", error.errors);
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
};


/**
 * =========================
 * GET MONTHLY PAYROLL DEDUCTION REPORT
 * =========================
 */
exports.getMonthlyPayrollDeduction = async (req, res) => {
  try {
    const { month, year } = req.query;
    const requestingUser = req.user;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Get all employees
    const employees = await User.find({
      role: "employee",
      isActive: true
    }).select("name email department salary");

    // Calculate deductions for each employee
    const payrollReport = await Promise.all(
      employees.map(async (employee) => {
        const attendances = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: startDate, $lte: endDate }
        });

        let totalDeductions = 0;
        let lateCount = 0;
        let earlyExitCount = 0;
        let absentCount = 0;
        let totalLateMinutes = 0;
        let totalEarlyExitMinutes = 0;

        for (const attendance of attendances) {
          // ✅ Use embedded breaks
          const breaks = attendance.breaks || [];
          const deductions = await calculateDeductions(attendance, breaks);

          totalDeductions += deductions.totalDeduction;
          if (deductions.lateMinutes > 0) {
            lateCount++;
            totalLateMinutes += deductions.lateMinutes;
          }
          if (deductions.earlyExitMinutes > 0) {
            earlyExitCount++;
            totalEarlyExitMinutes += deductions.earlyExitMinutes;
          }
          if (deductions.absentDeduction > 0) {
            absentCount++;
          }
        }

        // Calculate working days (excluding leaves)
        const leaves = await Leave.countDocuments({
          employeeId: employee._id,
          date: { $gte: startDate, $lte: endDate },
          status: 'APPROVED'
        });

        const workingDays = attendances.length;
        const totalDaysInMonth = lastDay;
        const absentDays = totalDaysInMonth - workingDays - leaves;

        return {
          employeeInfo: {
            id: employee._id,
            name: employee.name,
            email: employee.email,
            department: employee.department,
          },
          monthlySalary: employee.salary || 0,
          workingDays,
          leaveDays: leaves,
          absentDays,
          deductionSummary: {
            lateCount,
            totalLateMinutes,
            earlyExitCount,
            totalEarlyExitMinutes,
            absentCount,
            totalDeduction: totalDeductions,
          },
          netSalary: (employee.salary || 0) - totalDeductions,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Monthly payroll deduction report retrieved successfully",
      data: {
        month: parseInt(month),
        year: parseInt(year),
        monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
        payrollReport,
      },
    });
  } catch (error) {
    console.error("Get Monthly Payroll Deduction Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * =========================
 * UPDATE DEDUCTION RULES (PAYROLL SETTINGS)
 * =========================
 */
exports.updateDeductionRules = async (req, res) => {
  try {
    const requestingUser = req.user;

    const {
      lateGracePeriodMinutes,
      latePenalties,
      overtimeBonuses,
      earlyExitGraceMinutes,
      earlyExitPenaltyPerMinute,
      absentFullDayPenalty,
      halfDayPenalty,
      halfDayThresholdMinutes,
      standardShiftMinutes,
      maxBreakMinutes,
      excessBreakPenaltyPerMinute,
      notes,
    } = req.body;

    // Find or create active settings
    let settings = await PayrollSetting.findOne({ isActive: true });

    if (!settings) {
      console.log("📝 Creating new PayrollSetting with tiered penalties");
      settings = await PayrollSetting.create({
        lateGracePeriodMinutes,
        latePenalties,
        overtimeBonuses,
        earlyExitGraceMinutes,
        earlyExitPenaltyPerMinute,
        absentFullDayPenalty,
        halfDayPenalty,
        halfDayThresholdMinutes,
        standardShiftMinutes,
        maxBreakMinutes,
        excessBreakPenaltyPerMinute,
        notes,
        isActive: true,
        createdBy: requestingUser._id,
        updatedBy: requestingUser._id,
      });
    } else {
      console.log("📝 Updating existing PayrollSetting");
      
      if (lateGracePeriodMinutes !== undefined) settings.lateGracePeriodMinutes = lateGracePeriodMinutes;
      if (latePenalties !== undefined) settings.latePenalties = latePenalties;
      if (overtimeBonuses !== undefined) settings.overtimeBonuses = overtimeBonuses;
      if (earlyExitGraceMinutes !== undefined) settings.earlyExitGraceMinutes = earlyExitGraceMinutes;
      if (earlyExitPenaltyPerMinute !== undefined) settings.earlyExitPenaltyPerMinute = earlyExitPenaltyPerMinute;
      if (absentFullDayPenalty !== undefined) settings.absentFullDayPenalty = absentFullDayPenalty;
      if (halfDayPenalty !== undefined) settings.halfDayPenalty = halfDayPenalty;
      if (halfDayThresholdMinutes !== undefined) settings.halfDayThresholdMinutes = halfDayThresholdMinutes;
      if (standardShiftMinutes !== undefined) settings.standardShiftMinutes = standardShiftMinutes;
      if (maxBreakMinutes !== undefined) settings.maxBreakMinutes = maxBreakMinutes;
      if (excessBreakPenaltyPerMinute !== undefined) settings.excessBreakPenaltyPerMinute = excessBreakPenaltyPerMinute;
      if (notes !== undefined) settings.notes = notes;

      settings.updatedBy = requestingUser._id;
      await settings.save();
    }

    console.log("✅ PayrollSetting saved successfully");
    return res.status(200).json({
      success: true,
      message: "Payroll settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("❌ Update Deduction Rules Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * =========================
 * GET DEDUCTION RULES
 * =========================
 */
exports.getDeductionRules = async (req, res) => {
  try {
    // Fetch active payroll setting from database
    let settings = await PayrollSetting.findOne({ isActive: true });

    // If no settings exist, create default with tiered system
    if (!settings) {
      settings = await PayrollSetting.create({
        lateGracePeriodMinutes: 30,
        latePenalties: {
          after30Minutes: 100,
          after1Hour: 200,
          after1AndHalfHours: 250
        },
        overtimeBonuses: {
          after1Hour: 150,
          after2Hours: 250,
          after3Hours: 350,
          after4Hours: 450
        },
        earlyExitGraceMinutes: 15,
        earlyExitPenaltyPerMinute: 15,
        absentFullDayPenalty: 1000,
        halfDayPenalty: 500,
        halfDayThresholdMinutes: 240,
        standardShiftMinutes: 480,
        maxBreakMinutes: 60,
        excessBreakPenaltyPerMinute: 10,
        isActive: true,
        createdBy: req.user?._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payroll settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Get Deduction Rules Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


/**
 * =========================
 * GET DETAILED ATTENDANCE VIEW
 * =========================
 */
exports.getAttendanceDetailView = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    // ✅ Populate employee with user details
    const attendance = await Attendance.findById(id)
      .populate("employeeId", "name email role profileImage")
      .lean();

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Permission check
    if (
      requestingUser.role === "employee" &&
      attendance.employeeId._id.toString() !== requestingUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this record",
      });
    }

    // ✅ Fetch employee details from Employee model
    let employeeDetails = await Employee.findOne({ userId: attendance.employeeId._id })
      .select("jobInfo.department jobInfo.designation jobInfo.employeeId")
      .lean();

    // Fallback: try string conversion
    if (!employeeDetails) {
      employeeDetails = await Employee.findOne({ userId: attendance.employeeId._id.toString() })
        .select("jobInfo.department jobInfo.designation jobInfo.employeeId")
        .lean();
    }

    // ✅ Fetch breaks from embedded array
    const breaks = attendance.breaks || [];

    // ✅ Get images directly from nested structure
    const clockInImage = attendance.clockIn?.image;
    const clockOutImage = attendance.clockOut?.image;

    console.log("🔍 Clock In Image Path:", clockInImage);
    console.log("🔍 Clock Out Image Path:", clockOutImage);

    // ✅ PRIORITY 1: Use saved values from attendance document
    let netWorkMinutes = attendance.netWorkMinutes || 0;
    let netWorkHours = attendance.netWorkHours || 0;
    let totalBreakDuration = attendance.totalBreakDuration || 0;
    let overtimeMinutes = attendance.overtimeMinutes || 0;
    let overtimeHours = attendance.overtimeHours || 0;

    // ✅ PRIORITY 2: Calculate only if not saved (for old records)
    if (!netWorkMinutes && !netWorkHours) {
      const clockInTime = attendance.clockIn?.time;
      const clockOutTime = attendance.clockOut?.time;

      totalBreakDuration = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);

      if (clockInTime && clockOutTime) {
        const totalMinutes = Math.floor(
          (new Date(clockOutTime) - new Date(clockInTime)) / 60000
        );
        netWorkMinutes = Math.max(0, totalMinutes - totalBreakDuration);
        netWorkHours = parseFloat((netWorkMinutes / 60).toFixed(2));

        const STANDARD_WORK_HOURS = 8 * 60;
        overtimeMinutes = Math.max(0, netWorkMinutes - STANDARD_WORK_HOURS);
        overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));
      }
    } else {
      // If values are saved, still calculate total break duration from breaks array
      totalBreakDuration = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);
    }

    // ✅ Calculate deductions (this should still use calculateDeductions for consistency)
    const deductions = await calculateDeductions(attendance, breaks);

    // Format break sessions
    const breakSessions = breaks.map((breakItem, index) => ({
      breakNumber: index + 1,
      startTime: breakItem.breakStart,
      endTime: breakItem.breakEnd,
      duration: breakItem.breakDuration,
      durationHours: (breakItem.breakDuration / 60).toFixed(2),
      status: breakItem.breakEnd ? "Completed" : "Ongoing",
      reason: breakItem.reason || "Not specified",
      isActive: breakItem.isActive,
    }));

    // ✅ Structure with employee department and images
    const detailedView = {
      // Log Metadata
      logId: attendance._id,
      date: attendance.date,
      status: attendance.status,
      attendanceStatus: attendance.attendanceStatus,

      // ✅ Employee Information
      employeeInfo: {
        id: attendance.employeeId._id,
        name: attendance.employeeId.name,
        email: attendance.employeeId.email,
        department: employeeDetails?.jobInfo?.department || 'Unassigned',
        designation: employeeDetails?.jobInfo?.designation || attendance.employeeId.role || 'Employee',
        employeeCode: employeeDetails?.jobInfo?.employeeId || `EMP-${attendance.employeeId._id.toString().slice(-6)}`,
        role: attendance.employeeId.role,
        profileImage: attendance.employeeId.profileImage,
      },

      // ✅ Clock-In Details with image
      clockIn: attendance.clockIn?.time ? {
        time: attendance.clockIn.time,
        image: clockInImage,
        location: attendance.clockIn.location,
        expectedTime: attendance.shiftStartTime || "09:00",
        isLate: attendance.clockIn.isLate || attendance.lateFlag || false,
        lateBy: attendance.clockIn.lateBy || attendance.lateMinutes || 0,
      } : null,

      // ✅ Clock-Out Details with image
      clockOut: attendance.clockOut?.time ? {
        time: attendance.clockOut.time,
        image: clockOutImage,
        location: attendance.clockOut.location,
        isEarlyExit: attendance.clockOut.isEarlyExit || attendance.earlyExitFlag || false,
        earlyBy: attendance.clockOut.earlyBy || attendance.earlyExitMinutes || 0,
      } : null,

      // Break Sessions
      breaks: {
        sessions: breakSessions,
        totalBreaks: breaks.length,
        totalDuration: totalBreakDuration,
        totalDurationHours: (totalBreakDuration / 60).toFixed(2),
      },

      // ✅ Work Summary - Use saved values
      workSummary: {
        workDuration: netWorkMinutes,
        workDurationHours: netWorkHours.toFixed(2),
        totalBreakTime: totalBreakDuration,
        netWorkTime: netWorkMinutes,
        netWorkHours: netWorkHours.toFixed(2),
        expectedWorkMinutes: 480,
        expectedWorkHours: "8.00",
        overtime: {
          minutes: overtimeMinutes,
          hours: overtimeHours.toFixed(2),
          amount: attendance.overtimeAmount || 0,
        },
      },

      // Deductions & Penalties
      deductions: {
        late: {
          flag: attendance.lateFlag || deductions.lateMinutes > 0,
          minutes: attendance.lateMinutes || deductions.lateMinutes,
          amount: attendance.lateDeduction || deductions.lateDeduction,
        },
        earlyExit: {
          flag: attendance.earlyExitFlag || deductions.earlyExitMinutes > 0,
          minutes: attendance.earlyExitMinutes || deductions.earlyExitMinutes,
          amount: attendance.earlyExitDeduction || deductions.earlyExitDeduction,
        },
        absent: {
          amount: attendance.absentDeduction || deductions.absentDeduction,
          status: attendance.attendanceStatus,
        },
        total: attendance.totalDeduction || deductions.totalDeduction,
        breakdown: attendance.deductionBreakdown || deductions.deductionBreakdown,
      },

      // Additional Information
      additionalInfo: {
        shiftStartTime: attendance.shiftStartTime || "09:00",
        shiftEndTime: attendance.shiftEndTime || "18:00",
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Attendance details retrieved successfully",
      data: detailedView,
    });
  } catch (error) {
    console.error("Get Attendance Detail View Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


/**
 * @desc    Get All Employees Daily Logs (Admin Only)
 * @route   GET /api/v1/daily-logs/admin/all
 * @access  Private/Admin/SuperAdmin
 */
exports.getAllEmployeesDailyLogs = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      date,
      employeeId,
      departmentId,
      status,
      name,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // 📅 Date filtering
    if (date) {
      const searchDate = new Date(date);
      filter.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lte: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)) };
    } else if (endDate) {
      filter.date = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }else {
      // ✅ NEW: Default to last 40 days if no date provided
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      const fortyDaysAgoStr = fortyDaysAgo.toISOString().split('T')[0];
      filter.date = { $gte: fortyDaysAgoStr };
    }

    // 👤 Employee filter
    if (employeeId) {
      filter.employeeId = employeeId;
    }

    // 🏢 Department filter
    if (departmentId) {
      const employeesInDept = await User.find({ 
        department: departmentId
      }).select('_id');
      
      filter.employeeId = { 
        $in: employeesInDept.map(emp => emp._id) 
      };
    }

    // 🔍 Name search filter
    if (name) {
      const employeesByName = await User.find({
        name: { $regex: name, $options: 'i' }
      }).select('_id');

      if (filter.employeeId && filter.employeeId.$in) {
        const deptEmployeeIds = filter.employeeId.$in.map(id => id.toString());
        const nameEmployeeIds = employeesByName.map(emp => emp._id.toString());
        const intersection = deptEmployeeIds.filter(id => nameEmployeeIds.includes(id));
        filter.employeeId = { $in: intersection };
      } else {
        filter.employeeId = { $in: employeesByName.map(emp => emp._id) };
      }
    }

    // ✅ Status filter
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const dailyLogs = await Attendance.find(filter)
      .populate({
        path: 'employeeId',
        select: 'name email employeeCode department designation profileImage phone'
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalRecords = await Attendance.countDocuments(filter);

    // Process logs with your existing logic
    const processedLogs = await Promise.all(
      dailyLogs.map(async (log) => await processDailyLogRow(log, 'admin'))
    );

    // 📈 Calculate statistics
    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statistics = {
      total: totalRecords,
      checkedIn: stats.find(s => s._id === 'CHECKED_IN')?.count || 0,
      onBreak: stats.find(s => s._id === 'ON_BREAK')?.count || 0,
      checkedOut: stats.find(s => s._id === 'CHECKED_OUT')?.count || 0,
      onLeave: stats.find(s => s._id === 'ON_LEAVE')?.count || 0,
    };

    return res.status(200).json({
      success: true,
      message: 'Daily logs retrieved successfully',
      data: {
        logs: processedLogs,
        statistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / parseInt(limit)),
          totalRecords,
          limit: parseInt(limit),
          hasNextPage: skip + dailyLogs.length < totalRecords,
          hasPrevPage: parseInt(page) > 1
        },
        appliedFilters: {
          date,
          startDate,
          endDate,
          employeeId,
          departmentId,
          status,
          name
        }
      }
    });

  } catch (error) {
    console.error('Error in getAllEmployeesDailyLogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily logs',
      error: error.message
    });
  }
};


/**
 * @desc    Get My Daily Logs (Employee Only)
 * @route   GET /api/v1/daily-logs/my-logs
 * @access  Private/Employee
 */
exports.getMyDailyLogs = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      date,
      status,
      page = 1,
      limit = 30,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // ⚠️ CRITICAL SECURITY: Always use logged-in user's ID from JWT
    // Completely ignore any employeeId sent from frontend
    const loggedInUserId = req.user._id;

    // Build filter - ALWAYS locked to logged-in user
    const filter = { 
      employeeId: loggedInUserId // 🔒 Force data isolation
    };

    // 📅 Date filtering
    if (date) {
      const searchDate = new Date(date);
      filter.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lte: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)) };
    } else if (endDate) {
      filter.date = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }

    // ✅ Status filter
    if (status) {
      filter.status = status;
    }

    // 📄 Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 🔍 Execute query with limited population for employee
    const dailyLogs = await Attendance.find(filter)
      .populate({
        path: 'employeeId',
        select: 'name email employeeCode profileImage' // Limited fields for employee
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 📊 Get total count
    const totalRecords = await Attendance.countDocuments(filter);

    // Process logs with employee role (removes sensitive admin-only data)
    const processedLogs = await Promise.all(
      dailyLogs.map(async (log) => {
        const processed = await processDailyLogRow(log, 'employee');
        // Remove employeeInfo for employee's own view (they know who they are)
        delete processed.employeeInfo;
        return processed;
      })
    );

    // 📈 Personal statistics
    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const myStatistics = {
      total: totalRecords,
      checkedIn: stats.find(s => s._id === 'CHECKED_IN')?.count || 0,
      onBreak: stats.find(s => s._id === 'ON_BREAK')?.count || 0,
      checkedOut: stats.find(s => s._id === 'CHECKED_OUT')?.count || 0,
      onLeave: stats.find(s => s._id === 'ON_LEAVE')?.count || 0,
    };

    return res.status(200).json({
      success: true,
      message: 'My daily logs retrieved successfully',
      data: {
        logs: processedLogs,
        statistics: myStatistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / parseInt(limit)),
          totalRecords,
          limit: parseInt(limit),
          hasNextPage: skip + dailyLogs.length < totalRecords,
          hasPrevPage: parseInt(page) > 1
        },
        appliedFilters: {
          date,
          startDate,
          endDate,
          status
        }
      }
    });

  } catch (error) {
    console.error('Error in getMyDailyLogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your daily logs',
      error: error.message
    });
  }
};

/**
 * @desc    Get My Single Daily Log (Employee Only)
 * @route   GET /api/v1/daily-logs/my-logs/:logId
 * @access  Private/Employee
 */
exports.getMySingleDailyLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const loggedInUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid log ID",
      });
    }

    // Find log and verify ownership in a single query
    const dailyLog = await Attendance.findOne({
      _id: logId,
      employeeId: loggedInUserId // 🔒 Ensure employee can only access their own log
    }).populate({
      path: 'employeeId',
      select: 'name email employeeCode profileImage'
    });

    if (!dailyLog) {
      return res.status(404).json({
        success: false,
        message: 'Daily log not found or access denied'
      });
    }

    const processedLog = await processDailyLogRow(dailyLog.toObject(), 'employee');
    delete processedLog.employeeInfo; // Employee doesn't need their own info repeated

    return res.status(200).json({
      success: true,
      message: 'Daily log retrieved successfully',
      data: processedLog
    });

  } catch (error) {
    console.error('Error in getMySingleDailyLog:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily log',
      error: error.message
    });
  }
};

/**
 * @desc    Get Single Daily Log (Admin - Any Employee)
 * @route   GET /api/v1/daily-logs/admin/:logId
 * @access  Private/Admin/SuperAdmin
 */
exports.getAdminSingleDailyLog = async (req, res) => {
  try {
    const { logId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid log ID",
      });
    }

    const dailyLog = await Attendance.findById(logId)
      .populate({
        path: 'employeeId',
        select: 'name email employeeCode department designation profileImage phone'
      });

    if (!dailyLog) {
      return res.status(404).json({
        success: false,
        message: 'Daily log not found'
      });
    }

    const processedLog = await processDailyLogRow(dailyLog.toObject(), 'admin');

    return res.status(200).json({
      success: true,
      message: 'Daily log retrieved successfully',
      data: processedLog
    });

  } catch (error) {
    console.error('Error in getAdminSingleDailyLog:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily log',
      error: error.message
    });
  }
};