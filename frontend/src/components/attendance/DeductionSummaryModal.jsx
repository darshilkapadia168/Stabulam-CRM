import React from "react";

export default function DeductionSummaryModal({ open, onClose, log }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Deduction Summary</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        {/* Employee Info */}
        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
          <p><b>Employee:</b> {log?.employeeName}</p>
          <p><b>Date:</b> {log?.date}</p>
          <p><b>Status:</b> {log?.attendanceStatus}</p>
        </div>

        {/* Work Info */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-gray-500">Clock In</p>
            <p className="font-medium">{log?.clockInTime || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">Clock Out</p>
            <p className="font-medium">{log?.clockOutTime || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">Work Duration</p>
            <p className="font-medium">{log?.workDuration} min</p>
          </div>

          <div>
            <p className="text-gray-500">Break Duration</p>
            <p className="font-medium">{log?.totalBreakDuration || 0} min</p>
          </div>
        </div>

        {/* Deduction Info */}
        <div className="border rounded p-4 bg-red-50 text-sm space-y-2">
          <div className="flex justify-between">
            <span>Late Minutes</span>
            <span className="font-medium">{log?.lateMinutes || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Early Exit Minutes</span>
            <span className="font-medium">{log?.earlyExitMinutes || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Deduction Reason</span>
            <span className="font-medium text-red-600">
              {log?.deductionReason || "NONE"}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">Total Deduction</span>
            <span className="font-semibold text-red-700">
              ₹ {log?.deductionAmount || 0}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
