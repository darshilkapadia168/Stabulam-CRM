import React from 'react';
import { 
  Clock, Coffee, Check, Calendar, Eye, MapPin, 
  DollarSign, AlertTriangle, LogOut, TrendingUp, Timer 
} from "lucide-react";

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatTime = (dateString) => {
  if (!dateString || dateString === null || dateString === undefined) {
    return "Not clocked out";  // ✅ More descriptive
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid time";
    }
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "--:--";
  }
};

const getStatusBadge = (status) => {
  const statusConfig = {
    CHECKED_IN: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
      label: "Active",
      icon: <Clock size={12} className="text-blue-600" />
    },
    ON_BREAK: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
      label: "Break",
      icon: <Coffee size={12} className="text-orange-600" />
    },
    CHECKED_OUT: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
      label: "Done",
      icon: <Check size={12} className="text-gray-600" />
    },
    ON_LEAVE: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-200",
      label: "Leave",
      icon: <Calendar size={12} className="text-purple-600" />
    }
  };

  const config = statusConfig[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    label: status || "Unknown",
    icon: null
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.border}`}>
      {config.icon}
      <span className={`text-xs font-semibold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
};

// ============================================
// MAIN TABLE COMPONENT
// ============================================

const DailyLogsTable = ({ 
  logs = [], 
  userRole = "employee", 
  showAllDays = false, 
  onViewDetails,
  pagination = null,
  onPageChange = null,
  showEmployeeColumn = false
}) => {
  
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-lg border border-gray-200">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg font-medium">No attendance logs found</p>
        <p className="text-gray-400 text-sm mt-2">Logs will appear here once employees clock in</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            {/* Date Column */}
            {showAllDays && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Date
              </th>
            )}
            
            {/* Employee Column */}
            {showEmployeeColumn && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Employee
              </th>
            )}
            
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Clock In/Out
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Breaks
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Work Hours
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Overtime
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Late
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Early Exit
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Deduction
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Location
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-gray-200 bg-white">
          {logs.map((log) => (
            <tr 
              key={log._id} 
              className={`hover:bg-gray-50 transition-colors ${
                log.lateFlag || log.earlyExitFlag || (log.totalDeduction > 0) 
                  ? 'bg-red-50/20' 
                  : ''
              }`}
            >
              {/* Date Cell */}
              {showAllDays && (
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(log.date).toLocaleDateString('en-US', { 
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">
                      {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                </td>
              )}

              {/* Employee Info */}
              {showEmployeeColumn && (
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-gray-800">
                      {log.employeeInfo?.name || "N/A"}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {log.employeeInfo?.employeeCode || 'N/A'}
                    </p>
                    <p className="text-[10px] text-indigo-600 font-medium">
                      {log.employeeInfo?.department || 'N/A'}
                    </p>
                  </div>
                </td>
              )}

              {/* Clock In/Out Combined */}
                <td className="px-4 py-3">
                <div className="flex flex-col gap-1.5">
                    {/* Clock In */}
                    <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Clock size={12} className="text-green-600" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                        {formatTime(log.clockInTime)}
                        </p>
                        {log.lateFlag && (
                        <p className="text-[10px] text-red-600 font-medium">
                            +{log.lateMinutes}min late
                        </p>
                        )}
                    </div>
                    </div>

                    {/* Clock Out */}
                    {log.clockOutTime ? (
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                        <LogOut size={12} className="text-red-600" />
                        </div>
                        <div className="flex flex-col">
                        <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                            {formatTime(log.clockOutTime)}
                        </p>
                        {log.earlyExitFlag && (
                            <p className="text-[10px] text-orange-600 font-medium">
                            -{log.earlyExitMinutes}min early
                            </p>
                        )}
                        </div>
                    </div>
                    ) : log.status !== "CHECKED_OUT" ? (
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Timer size={12} className="text-blue-600" />
                        </div>
                        <p className="text-[10px] text-blue-600 font-medium">Active</p>
                    </div>
                    ) : (
                    <p className="text-xs text-gray-400">Not clocked out</p>
                    )}
                </div>
                </td>

              {/* Breaks Column */}
              <td className="px-4 py-3">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Coffee size={16} className="text-orange-500" />
                    <span className="text-lg font-bold text-gray-900">
                      {log.breakSummary?.totalBreaks || 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {log.breakSummary?.totalBreakHours || '0.00'}h
                  </p>
                </div>
              </td>

              {/* Work Hours */}
              <td className="px-4 py-3">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg font-bold text-blue-600">
                    {log.netWorkHours || '0.00'}
                  </span>
                  <p className="text-[10px] text-gray-500 font-medium">hours</p>
                </div>
              </td>

              {/* Overtime */}
              <td className="px-4 py-3">
                {parseFloat(log.overtimeHours) > 0 ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} className="text-green-600" />
                      <span className="text-sm font-bold text-green-600">
                        {log.overtimeHours}h
                      </span>
                    </div>
                    <p className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                      Bonus
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-xl text-gray-300 font-light">--</span>
                  </div>
                )}
              </td>

              {/* Late Status */}
              <td className="px-4 py-3">
                {log.lateFlag ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                      <AlertTriangle size={14} className="text-red-600" />
                      <span className="text-xs font-bold text-red-700">
                        {log.lateMinutes}m
                      </span>
                    </div>
                    {log.lateDeduction > 0 && (
                      <p className="text-[10px] text-red-600 font-medium">
                        -₹{log.lateDeduction.toFixed(0)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={14} className="text-green-600" />
                    </div>
                  </div>
                )}
              </td>

              {/* Early Exit Status */}
              <td className="px-4 py-3">
                {log.earlyExitFlag ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                      <Clock size={14} className="text-orange-600" />
                      <span className="text-xs font-bold text-orange-700">
                        {log.earlyExitMinutes}m
                      </span>
                    </div>
                    {log.earlyExitDeduction > 0 && (
                      <p className="text-[10px] text-orange-600 font-medium">
                        -₹{log.earlyExitDeduction.toFixed(0)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={14} className="text-green-600" />
                    </div>
                  </div>
                )}
              </td>

              {/* Total Deduction */}
              <td className="px-4 py-3">
                {log.totalDeduction > 0 ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 bg-red-100 px-2.5 py-1 rounded-lg">
                      <DollarSign size={14} className="text-red-700" />
                      <span className="text-sm font-bold text-red-700">
                        {log.totalDeduction.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-red-600 font-medium">deducted</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={14} className="text-green-600" />
                    </div>
                  </div>
                )}
              </td>

              {/* Status Badge */}
              <td className="px-4 py-3">
                <div className="flex justify-center">
                  {getStatusBadge(log.status)}
                </div>
              </td>

              {/* Location */}
              <td className="px-4 py-3">
                {log.location ? (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">
                      {log.location.officeTag || "Unknown"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xl text-gray-300 font-light">--</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => onViewDetails && onViewDetails(log)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-sm"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* ✅ Pagination Section */}
      {pagination && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} entries
            </p>
            
            {/* Only show navigation buttons if multiple pages exist */}
            {pagination.totalPages > 1 && (
            <div className="flex gap-2">
                <button
                onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                Previous
                </button>
                <span className="px-3 py-1.5 text-sm font-semibold text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                Next
                </button>
            </div>
            )}
        </div>
        )}
    </div>
  );
};

export default DailyLogsTable;