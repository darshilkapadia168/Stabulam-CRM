import React, { useState, useEffect } from "react";
import { X, AlertTriangle, DollarSign, Clock, Calculator, Info } from "lucide-react";

export default function DeductionModal({ open, onClose, log, onSave }) {
  const [lateMinutes, setLateMinutes] = useState(0);
  const [earlyExitMinutes, setEarlyExitMinutes] = useState(0);
  const [attendanceStatus, setAttendanceStatus] = useState("PRESENT");
  const [deductionReason, setDeductionReason] = useState("NONE");
  const [manualDeduction, setManualDeduction] = useState(0);
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [calculatedDeduction, setCalculatedDeduction] = useState(0);

  // Load existing data when modal opens
  useEffect(() => {
    if (log) {
      setLateMinutes(log.lateMinutes || 0);
      setEarlyExitMinutes(log.earlyExitMinutes || 0);
      setAttendanceStatus(log.attendanceStatus || "PRESENT");
      setDeductionReason(log.deductionReason || "NONE");
      setManualDeduction(log.deductionAmount || 0);
    }
  }, [log]);

  // Fetch payroll settings
  useEffect(() => {
    if (open) {
      fetchPayrollSettings();
    }
  }, [open]);

  const fetchPayrollSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/payroll-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPayrollSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch payroll settings:", error);
    }
  };

  // Auto-calculate deduction
  useEffect(() => {
    if (payrollSettings) {
      let total = 0;

      // Late deduction
      if (lateMinutes > 0) {
        total += lateMinutes * payrollSettings.latePenaltyPerMinute;
      }

      // Early exit deduction
      if (earlyExitMinutes > 0) {
        total += earlyExitMinutes * payrollSettings.earlyExitPenaltyPerMinute;
      }

      // Attendance status deduction
      if (attendanceStatus === "ABSENT") {
        total += payrollSettings.absentFullDayPenalty;
      } else if (attendanceStatus === "HALF_DAY") {
        total += payrollSettings.halfDayPenalty;
      }

      setCalculatedDeduction(total);
    }
  }, [lateMinutes, earlyExitMinutes, attendanceStatus, payrollSettings]);

  const handleSave = () => {
    const totalDeduction = manualDeduction > 0 ? manualDeduction : calculatedDeduction;

    const payload = {
      lateMinutes,
      earlyExitMinutes,
      attendanceStatus,
      deductionReason,
      deductionAmount: totalDeduction,
      calculatedDeduction,
      manualOverride: manualDeduction > 0,
    };

    onSave(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Deduction & Compliance</h2>
                <p className="text-red-100 text-sm mt-1">Calculate salary deductions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Employee</p>
                <p className="text-gray-900 font-semibold text-lg">{log?.employeeInfo?.name || "N/A"}</p>
                <p className="text-gray-500 text-xs">{log?.employeeInfo?.employeeCode}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Date</p>
                <p className="text-gray-900 font-semibold text-lg">{log?.date}</p>
                <p className="text-gray-500 text-xs">{log?.status || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Current Deductions Display */}
          {log && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info size={18} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Current Deductions</p>
                  <p className="text-sm text-yellow-700">Existing penalties applied</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded p-3">
                  <p className="text-gray-600">Late</p>
                  <p className="font-bold text-red-600">₹{log.lateDeduction || 0}</p>
                  <p className="text-xs text-gray-500">{log.lateMinutes || 0} min</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-gray-600">Early Exit</p>
                  <p className="font-bold text-orange-600">₹{log.earlyExitDeduction || 0}</p>
                  <p className="text-xs text-gray-500">{log.earlyExitMinutes || 0} min</p>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-gray-600">Total</p>
                  <p className="font-bold text-gray-900">₹{log.totalDeduction || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Late Minutes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Clock size={16} className="text-red-500" />
              Late Minutes
            </label>
            <input
              type="number"
              value={lateMinutes}
              onChange={(e) => setLateMinutes(Number(e.target.value))}
              min="0"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none"
              placeholder="0"
            />
            {payrollSettings && lateMinutes > 0 && (
              <p className="text-sm text-red-600 font-medium">
                Deduction: ₹{lateMinutes * payrollSettings.latePenaltyPerMinute} 
                <span className="text-gray-500"> (₹{payrollSettings.latePenaltyPerMinute}/min)</span>
              </p>
            )}
          </div>

          {/* Early Exit Minutes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Clock size={16} className="text-orange-500" />
              Early Exit Minutes
            </label>
            <input
              type="number"
              value={earlyExitMinutes}
              onChange={(e) => setEarlyExitMinutes(Number(e.target.value))}
              min="0"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder="0"
            />
            {payrollSettings && earlyExitMinutes > 0 && (
              <p className="text-sm text-orange-600 font-medium">
                Deduction: ₹{earlyExitMinutes * payrollSettings.earlyExitPenaltyPerMinute}
                <span className="text-gray-500"> (₹{payrollSettings.earlyExitPenaltyPerMinute}/min)</span>
              </p>
            )}
          </div>

          {/* Attendance Status */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <AlertTriangle size={16} className="text-gray-500" />
              Attendance Status
            </label>
            <select
              value={attendanceStatus}
              onChange={(e) => setAttendanceStatus(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
            {payrollSettings && (
              <div className="text-sm">
                {attendanceStatus === "ABSENT" && (
                  <p className="text-gray-600 font-medium">
                    Deduction: ₹{payrollSettings.absentFullDayPenalty} (Full Day)
                  </p>
                )}
                {attendanceStatus === "HALF_DAY" && (
                  <p className="text-yellow-600 font-medium">
                    Deduction: ₹{payrollSettings.halfDayPenalty} (Half Day)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Deduction Reason */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Info size={16} className="text-blue-500" />
              Deduction Reason
            </label>
            <select
              value={deductionReason}
              onChange={(e) => setDeductionReason(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="NONE">None</option>
              <option value="LATE">Late Arrival</option>
              <option value="EARLY_EXIT">Early Exit</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="UNAUTHORIZED_BREAK">Unauthorized Break</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Calculated Deduction Summary */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={20} className="text-red-600" />
              <h3 className="font-bold text-gray-900">Auto-Calculated Deduction</h3>
            </div>
            <div className="text-3xl font-bold text-red-600">
              ₹{calculatedDeduction.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Based on payroll settings</p>
          </div>

          {/* Manual Override */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <DollarSign size={16} className="text-purple-500" />
              Manual Deduction Override (₹)
            </label>
            <input
              type="number"
              value={manualDeduction}
              onChange={(e) => setManualDeduction(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Leave empty to use auto-calculated"
            />
            <p className="text-xs text-gray-500">
              Leave as 0 to use auto-calculated amount. Enter value to override.
            </p>
          </div>

          {/* Final Deduction Display */}
          <div className="bg-gray-900 text-white rounded-lg p-5">
            <p className="text-sm text-gray-400 mb-1">Final Deduction Amount</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                ₹{(manualDeduction > 0 ? manualDeduction : calculatedDeduction).toFixed(2)}
              </span>
              {manualDeduction > 0 && (
                <span className="text-sm text-yellow-400">(Manual Override)</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <DollarSign size={18} />
              Apply Deduction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}