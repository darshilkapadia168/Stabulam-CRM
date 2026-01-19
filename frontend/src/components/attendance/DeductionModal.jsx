import React, { useState, useEffect } from "react";

export default function DeductionModal({ open, onClose, log, onSave }) {
  const [lateMinutes, setLateMinutes] = useState(0);
  const [earlyExitMinutes, setEarlyExitMinutes] = useState(0);
  const [attendanceStatus, setAttendanceStatus] = useState("PRESENT");
  const [deductionReason, setDeductionReason] = useState("NONE");
  const [deductionAmount, setDeductionAmount] = useState(0);

  // Load existing data when modal opens
  useEffect(() => {
    if (log) {
      setLateMinutes(log.lateMinutes || 0);
      setEarlyExitMinutes(log.earlyExitMinutes || 0);
      setAttendanceStatus(log.attendanceStatus || "PRESENT");
      setDeductionReason(log.deductionReason || "NONE");
      setDeductionAmount(log.deductionAmount || 0);
    }
  }, [log]);

  const handleSave = () => {
    const payload = {
      lateMinutes,
      earlyExitMinutes,
      attendanceStatus,
      deductionReason,
      deductionAmount,
    };

    onSave(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Deduction & Compliance</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        {/* Employee Info */}
        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
          <p><b>Employee:</b> {log?.employeeName}</p>
          <p><b>Date:</b> {log?.date}</p>
        </div>

        {/* Late Minutes */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Late Minutes</label>
          <input
            type="number"
            value={lateMinutes}
            onChange={(e) => setLateMinutes(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Early Exit Minutes */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Early Exit Minutes</label>
          <input
            type="number"
            value={earlyExitMinutes}
            onChange={(e) => setEarlyExitMinutes(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Attendance Status */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Attendance Status</label>
          <select
            value={attendanceStatus}
            onChange={(e) => setAttendanceStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="PRESENT">Present</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ABSENT">Absent</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>

        {/* Deduction Reason */}
        <div className="mb-3">
          <label className="block text-sm mb-1">Deduction Reason</label>
          <select
            value={deductionReason}
            onChange={(e) => setDeductionReason(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="NONE">None</option>
            <option value="LATE">Late</option>
            <option value="EARLY_EXIT">Early Exit</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
          </select>
        </div>

        {/* Deduction Amount */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Deduction Amount (₹)</label>
          <input
            type="number"
            value={deductionAmount}
            onChange={(e) => setDeductionAmount(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Save Deduction
          </button>
        </div>

      </div>
    </div>
  );
}
