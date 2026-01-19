const Attendance = require("../models/Attendance");
const Break = require("../models/Break");
const Leave = require("../models/Leave");
const User = require("../models/User");
const PayrollSetting = require("../models/PayrollSetting");
const { getTodayDate } = require("../utils/date.util");

/**
 * =========================
 * GET DAILY LOGS (Attendance Listing)
 * =========================
 */
exports.getDailyLogs = async (req, res) => {
    try {
        const { date, employeeId, status, page = 1, limit = 50 } = req.query;
        const requestingUser = req.user;

        // Build query
        const query = {};

        // Filter by date
        if (date) {
            query.date = date;
        } else {
            query.date = getTodayDate(); // Default to today
        }

        // If employee role, show only their data
        if (requestingUser.role === "employee") {
            query.employeeId = requestingUser._id;
        } else if (employeeId) {
            // Admin/Manager can filter by specific employee
            query.employeeId = employeeId;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Get attendance records
        const attendances = await Attendance.find(query)
            .populate("employeeId", "name email employeeCode department")
            .sort({ clockInTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Attendance.countDocuments(query);

        // Get all employees if admin wants full daily log (including those who didn't clock in)
        let allEmployees = [];
        if (!employeeId && requestingUser.role !== "employee") {
            allEmployees = await User.find({ role: "employee", isActive: true }).select(
                "name email employeeCode department"
            );
        }

        // Process each attendance record
        const dailyLogs = await Promise.all(
            attendances.map(async (attendance) => {
                return await processDailyLogRow(attendance, requestingUser.role);
            })
        );

        // Add employees who didn't clock in (if admin)
        if (allEmployees.length > 0 && !employeeId) {
            const attendedEmployeeIds = new Set(
                attendances.map((a) => a.employeeId._id.toString())
            );

            // Check for leaves
            const leaves = await Leave.find({
                date: query.date,
                status: "APPROVED",
            }).populate("employeeId", "name email employeeCode department");

            const leavesMap = new Map(
                leaves.map((leave) => [leave.employeeId._id.toString(), leave])
            );

            for (const employee of allEmployees) {
                const empId = employee._id.toString();

                if (!attendedEmployeeIds.has(empId)) {
                    // Check if on leave
                    const leave = leavesMap.get(empId);

                    dailyLogs.push({
                        date: query.date,
                        employeeInfo: {
                            id: employee._id,
                            name: employee.name,
                            email: employee.email,
                            employeeCode: employee.employeeCode,
                            department: employee.department,
                        },
                        clockInTime: null,
                        clockOutTime: null,
                        breakSummary: {
                            totalBreaks: 0,
                            totalBreakDuration: 0,
                        },
                        netWorkHours: 0,
                        // 🆕 Late mark info for absent employees
                        lateFlag: false,
                        lateMinutes: 0,
                        overtimeHours: 0,
                        deductionAmount: 0,
                        location: null,
                        status: leave ? "ON_LEAVE" : null,
                        leaveType: leave ? leave.leaveType : null,
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Daily logs retrieved successfully",
            data: {
                logs: dailyLogs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
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
 * PROCESS SINGLE DAILY LOG ROW
 * =========================
 */
async function processDailyLogRow(attendance, userRole) {
    const breaks = await Break.find({ attendanceId: attendance._id });

    const totalBreaks = breaks.length;
    const totalBreakDuration = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);

    let netWorkMinutes = 0;
    if (attendance.clockInTime && attendance.clockOutTime) {
        const totalMinutes = Math.floor(
            (attendance.clockOutTime - attendance.clockInTime) / 60000
        );
        netWorkMinutes = Math.max(0, totalMinutes - totalBreakDuration);
    }

    // 🆕 Await deductions
    const deductionDetails = await calculateDeductions(attendance, breaks);

    const logRow = {
        date: attendance.date,
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        netWorkMinutes,
        netWorkHours: (netWorkMinutes / 60).toFixed(2),

        // Deductions
        lateMinutes: deductionDetails.lateMinutes,
        lateDeduction: deductionDetails.lateDeduction,
        earlyExitMinutes: deductionDetails.earlyExitMinutes,
        earlyExitDeduction: deductionDetails.earlyExitDeduction,
        absentDeduction: deductionDetails.absentDeduction,
        totalDeduction: deductionDetails.totalDeduction,

        // Flags
        lateFlag: deductionDetails.lateMinutes > 0,
        earlyExitFlag: deductionDetails.earlyExitMinutes > 0,

        shiftStartTime: attendance.shiftStartTime || "09:00",
        gracePeriodMinutes: attendance.gracePeriodMinutes || 15,
        overtimeHours: (deductionDetails.overtimeMinutes / 60).toFixed(2),
        overtimeMinutes: deductionDetails.overtimeMinutes,
        location: attendance.location,
        status: attendance.status,
        photoReference: attendance.photoReference,
    };

    if (userRole === "admin" || userRole === "manager") {
        logRow.employeeInfo = {
            id: attendance.employeeId._id,
            name: attendance.employeeId.name,
            email: attendance.employeeId.email,
            employeeCode: attendance.employeeId.employeeCode,
            department: attendance.employeeId.department,
        };
    }

    return logRow;
}


/**
 * =========================
 * GET DAILY LOG BY ID
 * =========================
 */
const mongoose = require("mongoose"); // Add this at the top if not already

exports.getDailyLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const requestingUser = req.user;

        // ✅ Validate ObjectId first
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance ID",
            });
        }

        // Find attendance by ID
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

        // Role-based permission check
        if (
            requestingUser.role === "employee" &&
            attendance.employeeId._id.toString() !== requestingUser._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this record",
            });
        }

        // Process attendance row (deductions, late, early exit, etc.)
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
 * GET DAILY SUMMARY
 * =========================
 */
exports.getDailySummary = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || getTodayDate();

        // Get all attendance records for the date
        const attendances = await Attendance.find({ date: targetDate });

        // Get total employees
        const totalEmployees = await User.countDocuments({
            role: "employee",
            isActive: true,
        });

        // Get leaves
        const leaves = await Leave.countDocuments({
            date: targetDate,
            status: "APPROVED",
        });

        // Calculate stats
        const present = attendances.length;

        const checkedIn = attendances.filter(
            (a) => a.status === "CHECKED_IN" || a.status === "ON_BREAK"
        ).length;

        const checkedOut = attendances.filter((a) => a.status === "CHECKED_OUT").length;

        const onBreak = attendances.filter((a) => a.status === "ON_BREAK").length;

        const notClockedIn = Math.max(0, totalEmployees - attendances.length - leaves);

        // 🆕 CALCULATE LATE EMPLOYEES FROM STORED DATA
        const lateEmployees = attendances.filter((a) => a.lateFlag === true).length;

        return res.status(200).json({
            success: true,
            message: "Daily summary retrieved successfully",
            data: {
                date: targetDate,
                totalEmployees,
                present,
                leaves,
                notClockedIn,
                checkedIn,
                checkedOut,
                onBreak,
                lateEmployees, // 🆕 Now uses stored lateFlag
            },
        });
    } catch (error) {
        console.error("Get Daily Summary Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


// controllers/dailyLogsController.js - ADD THESE NEW FUNCTIONS

/**
 * =========================
 * DEDUCTION CONFIGURATION
 * =========================
 */
const DEDUCTION_RULES = {
    GRACE_PERIOD_MINUTES: 15,
    LATE_DEDUCTION_PER_MINUTE: 10, // ₹10 per minute after grace
    EARLY_EXIT_DEDUCTION_PER_MINUTE: 15, // ₹15 per minute before shift end
    ABSENT_FULL_DAY_DEDUCTION: 1000, // ₹1000 for full day absent
    HALF_DAY_THRESHOLD_MINUTES: 240, // 4 hours minimum for half day
    HALF_DAY_ABSENT_DEDUCTION: 500, // ₹500 for half day
    STANDARD_SHIFT_DURATION_MINUTES: 480, // 8 hours
    SHIFT_END_GRACE_MINUTES: 15, // Grace period for early exit
};

/**
 * =========================
 * CALCULATE DEDUCTIONS
 * =========================
 */
async function calculateDeductions(attendance, breaks = []) {
  const payroll = await PayrollSetting.findOne({ isActive: true });

  if (!payroll) {
    throw new Error("Payroll setting not found");
  }

  const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);
  const totalWorkMinutes = attendance.clockOutTime && attendance.clockInTime
      ? Math.floor((attendance.clockOutTime - attendance.clockInTime) / 60000) - totalBreakMinutes
      : 0;

  const lateMinutes = Math.max(0, (attendance.lateMinutes || 0) - payroll.graceLateMinutes);
  const lateDeduction = lateMinutes * payroll.latePenaltyPerMinute;

  const expectedShiftEnd = new Date(attendance.clockInTime);
  expectedShiftEnd.setMinutes(expectedShiftEnd.getMinutes() + payroll.standardShiftMinutes);

  const earlyExitMinutes = Math.max(0, Math.floor((expectedShiftEnd - attendance.clockOutTime) / 60000) - payroll.graceEarlyMinutes);
  const earlyExitDeduction = earlyExitMinutes * payroll.earlyExitPenaltyPerMinute;

  const absentDeduction = (!attendance.clockInTime || !attendance.clockOutTime) ? payroll.absentFullDayPenalty : 0;

  const overtimeMinutes = Math.max(0, totalWorkMinutes - payroll.standardShiftMinutes);
  const overtimeAmount = overtimeMinutes >= payroll.minimumOvertimeMinutes ? overtimeMinutes * payroll.overtimeRatePerMinute : 0;

  const totalDeduction = lateDeduction + earlyExitDeduction + absentDeduction;

  return {
      lateMinutes,
      lateDeduction,
      earlyExitMinutes,
      earlyExitDeduction,
      absentDeduction,
      overtimeMinutes,
      overtimeAmount,
      totalDeduction
  };
}




/**
 * =========================
 * UPDATE processDailyLogRow WITH ENHANCED DEDUCTIONS
 * =========================
 */
async function processDailyLogRow(attendance, userRole) {
    // Get all breaks for this attendance
    const breaks = await Break.find({ attendanceId: attendance._id });

    // Calculate break summary
    const totalBreaks = breaks.length;
    const totalBreakDuration = breaks.reduce((sum, b) => sum + (b.breakDuration || 0), 0);

    // Calculate net work hours
    let netWorkMinutes = 0;
    if (attendance.clockInTime && attendance.clockOutTime) {
        const totalMinutes = Math.floor(
            (attendance.clockOutTime - attendance.clockInTime) / 60000
        );
        netWorkMinutes = Math.max(0, totalMinutes - totalBreakDuration);
    } else if (attendance.clockInTime && attendance.status !== "CHECKED_OUT") {
        const now = new Date();
        const totalMinutes = Math.floor((now - attendance.clockInTime) / 60000);
        netWorkMinutes = Math.max(0, totalMinutes - totalBreakDuration);
    }

    // 🆕 CALCULATE COMPREHENSIVE DEDUCTIONS
    const deductionDetails = await calculateDeductions(attendance, breaks);


    // Calculate overtime
    const STANDARD_WORK_HOURS = 8 * 60;
    const overtimeMinutes = Math.max(0, netWorkMinutes - STANDARD_WORK_HOURS);

    // Build response with enhanced deduction info
    const logRow = {
        date: attendance.date,
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        breakSummary: {
            totalBreaks,
            totalBreakDuration,
            totalBreakHours: (totalBreakDuration / 60).toFixed(2),
        },
        netWorkHours: (netWorkMinutes / 60).toFixed(2),
        netWorkMinutes,

        // 🆕 ENHANCED DEDUCTION INFORMATION
        lateFlag: attendance.lateFlag || false,
        lateMinutes: deductionDetails.lateMinutes,
        lateDeduction: deductionDetails.lateDeduction,
        lateStatus: attendance.lateFlag ? `Late by ${deductionDetails.lateMinutes} min` : "On Time",

        // 🆕 EARLY EXIT INFORMATION
        earlyExitMinutes: deductionDetails.earlyExitMinutes,
        earlyExitDeduction: deductionDetails.earlyExitDeduction,
        earlyExitFlag: deductionDetails.earlyExitMinutes > 0,

        // 🆕 ABSENT DEDUCTION
        absentDeduction: deductionDetails.absentDeduction,

        // 🆕 TOTAL DEDUCTION & BREAKDOWN
        totalDeduction: deductionDetails.totalDeduction,
        deductionBreakdown: deductionDetails.deductionReasons,

        shiftStartTime: attendance.shiftStartTime || "09:00",
        gracePeriodMinutes: attendance.gracePeriodMinutes || 15,
        overtimeHours: (overtimeMinutes / 60).toFixed(2),
        overtimeMinutes,
        location: attendance.location,
        status: attendance.status,
        photoReference: attendance.photoReference,
    };

    // Include employee info only if admin/manager
    if (userRole === "admin" || userRole === "manager") {
        logRow.employeeInfo = {
            id: attendance.employeeId._id,
            name: attendance.employeeId.name,
            email: attendance.employeeId.email,
            employeeCode: attendance.employeeId.employeeCode,
            department: attendance.employeeId.department,
        };
    }

    return logRow;
}

/**
 * =========================
 * 🆕 GET DEDUCTION SUMMARY REPORT
 * =========================
 */
exports.getDeductionSummary = async (req, res) => {
    try {
        const { date, employeeId, startDate, endDate } = req.query;
        const requestingUser = req.user;

        // Build date query
        let dateQuery = {};
        if (startDate && endDate) {
            dateQuery = { date: { $gte: startDate, $lte: endDate } };
        } else if (date) {
            dateQuery = { date };
        } else {
            dateQuery = { date: getTodayDate() };
        }

        // Build employee query
        let empQuery = {};
        if (requestingUser.role === "employee") {
            empQuery.employeeId = requestingUser._id;
        } else if (employeeId) {
            empQuery.employeeId = employeeId;
        }

        // Get all attendance records
        const attendances = await Attendance.find({ ...dateQuery, ...empQuery })
            .populate("employeeId", "name email employeeCode department")
            .sort({ date: -1 });

        // Calculate deductions for each record
        const deductionReports = await Promise.all(
            attendances.map(async (attendance) => {
                const breaks = await Break.find({ attendanceId: attendance._id });
                const deductions = calculateDeductions(attendance, breaks);

                return {
                    date: attendance.date,
                    employeeInfo: {
                        id: attendance.employeeId._id,
                        name: attendance.employeeId.name,
                        email: attendance.employeeId.email,
                        employeeCode: attendance.employeeId.employeeCode,
                        department: attendance.employeeId.department,
                    },
                    clockInTime: attendance.clockInTime,
                    clockOutTime: attendance.clockOutTime,
                    lateMinutes: deductions.lateMinutes,
                    lateDeduction: deductions.lateDeduction,
                    earlyExitMinutes: deductions.earlyExitMinutes,
                    earlyExitDeduction: deductions.earlyExitDeduction,
                    absentDeduction: deductions.absentDeduction,
                    totalDeduction: deductions.totalDeduction,
                    deductionReasons: deductions.deductionReasons,
                    netWorkMinutes: deductions.netWorkMinutes,
                    netWorkHours: (deductions.netWorkMinutes / 60).toFixed(2),
                };
            })
        );

        // Calculate totals
        const summary = {
            totalRecords: deductionReports.length,
            totalLateDeductions: deductionReports.reduce((sum, r) => sum + r.lateDeduction, 0),
            totalEarlyExitDeductions: deductionReports.reduce((sum, r) => sum + r.earlyExitDeduction, 0),
            totalAbsentDeductions: deductionReports.reduce((sum, r) => sum + r.absentDeduction, 0),
            grandTotalDeductions: deductionReports.reduce((sum, r) => sum + r.totalDeduction, 0),
            lateCount: deductionReports.filter(r => r.lateMinutes > 0).length,
            earlyExitCount: deductionReports.filter(r => r.earlyExitMinutes > 0).length,
            absentCount: deductionReports.filter(r => r.absentDeduction > 0).length,
        };

        return res.status(200).json({
            success: true,
            message: "Deduction summary retrieved successfully",
            data: {
                summary,
                deductionReports,
                deductionRules: DEDUCTION_RULES,
            },
        });
    } catch (error) {
        console.error("Get Deduction Summary Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * =========================
 * 🆕 GET MONTHLY PAYROLL DEDUCTION REPORT
 * =========================
 */
exports.getMonthlyPayrollDeduction = async (req, res) => {
    try {
        const { month, year } = req.query; // Format: month=1-12, year=2024
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
        }).select("name email employeeCode department salary");

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
                    const breaks = await Break.find({ attendanceId: attendance._id });
                    const deductions = calculateDeductions(attendance, breaks);

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
                        employeeCode: employee.employeeCode,
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
                deductionRules: DEDUCTION_RULES,
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
 * 🆕 UPDATE DEDUCTION RULES (Admin Only)
 * =========================
 */
exports.updateDeductionRules = async (req, res) => {
    try {
        const requestingUser = req.user;

        if (requestingUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Only admin can update deduction rules",
            });
        }

        const updates = req.body;

        // Validate and update rules
        Object.keys(updates).forEach(key => {
            if (DEDUCTION_RULES.hasOwnProperty(key)) {
                DEDUCTION_RULES[key] = updates[key];
            }
        });

        // In production, save this to database or config file
        // For now, it's in-memory

        return res.status(200).json({
            success: true,
            message: "Deduction rules updated successfully",
            data: DEDUCTION_RULES,
        });
    } catch (error) {
        console.error("Update Deduction Rules Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * =========================
 * 🆕 GET DEDUCTION RULES
 * =========================
 */
exports.getDeductionRules = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Deduction rules retrieved successfully",
            data: DEDUCTION_RULES,
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
 * 🆕 GET LATE EMPLOYEES REPORT
 * =========================
 */
exports.getLateEmployeesReport = async (req, res) => {
    try {
        const { date, page = 1, limit = 50 } = req.query;
        const targetDate = date || getTodayDate();

        // Find all late employees for the date
        const query = {
            date: targetDate,
            lateFlag: true,
        };

        const skip = (page - 1) * limit;

        const lateAttendances = await Attendance.find(query)
            .populate("employeeId", "name email employeeCode department")
            .sort({ lateMinutes: -1 }) // Sort by most late first
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Attendance.countDocuments(query);

        const lateReport = lateAttendances.map((attendance) => ({
            employeeInfo: {
                id: attendance.employeeId._id,
                name: attendance.employeeId.name,
                email: attendance.employeeId.email,
                employeeCode: attendance.employeeId.employeeCode,
                department: attendance.employeeId.department,
            },
            clockInTime: attendance.clockInTime,
            expectedClockInTime: attendance.expectedClockInTime,
            lateMinutes: attendance.lateMinutes,
            shiftStartTime: attendance.shiftStartTime,
            gracePeriodMinutes: attendance.gracePeriodMinutes,
            location: attendance.location,
            deduction: attendance.lateMinutes * 10, // ₹10 per minute
        }));

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