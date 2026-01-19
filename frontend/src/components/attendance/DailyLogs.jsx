import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Clock,
  Coffee,
  AlertCircle,
  TrendingUp,
  Filter,
  Download,
  Eye,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
  Timer,
  TrendingDown,
  FileText,
} from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE = "http://localhost:5000/api";

const DailyLogs = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // 🆕 Deduction Modal State
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [selectedLogForDeduction, setSelectedLogForDeduction] = useState(null);
  
  // 🆕 Deduction Summary State
  const [deductionSummary, setDeductionSummary] = useState(null);
  const [showDeductionSummary, setShowDeductionSummary] = useState(false);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role") || "employee";
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch daily logs
  const fetchDailyLogs = async () => {
    setLoading(true);
    try {
      const params = {
        date: selectedDate,
        page,
        limit: 50,
      };

      if (filterStatus !== "all") {
        params.status = filterStatus;
      }

      const res = await axios.get(`${API_BASE}/daily-logs`, {
        ...axiosConfig,
        params,
      });

      setLogs(res.data.data.logs);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
      alert("Failed to fetch daily logs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily summary
  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE}/daily-logs/summary`, {
        ...axiosConfig,
        params: { date: selectedDate },
      });
      setSummary(res.data.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  // 🆕 Fetch Deduction Summary
  const fetchDeductionSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE}/daily-logs/deduction-summary`, {
        ...axiosConfig,
        params: { date: selectedDate },
      });
      setDeductionSummary(res.data.data);
    } catch (error) {
      console.error("Error fetching deduction summary:", error);
    }
  };

  useEffect(() => {
    fetchDailyLogs();
    fetchSummary();
    fetchDeductionSummary();
  }, [selectedDate, filterStatus, page]);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => console.log("⚡ Daily Logs Connected"));
    socket.on("attendance:update", () => {
      console.log("📡 Attendance updated - refreshing logs");
      fetchDailyLogs();
      fetchSummary();
      fetchDeductionSummary();
    });

    return () => socket.disconnect();
  }, [selectedDate, filterStatus, page]);

  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      CHECKED_IN: {
        label: "Checked In",
        class: "bg-green-100 text-green-700 border-green-200",
      },
      ON_BREAK: {
        label: "On Break",
        class: "bg-orange-100 text-orange-700 border-orange-200",
      },
      CHECKED_OUT: {
        label: "Checked Out",
        class: "bg-blue-100 text-blue-700 border-blue-200",
      },
      ON_LEAVE: {
        label: "On Leave",
        class: "bg-purple-100 text-purple-700 border-purple-200",
      },
    };

    const config = statusConfig[status] || {
      label: "Not Clocked In",
      class: "bg-gray-100 text-gray-600 border-gray-200",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config.class}`}>
        {config.label}
      </span>
    );
  };

  // 🆕 Render Late Status with Enhanced UI
  const renderLateStatus = (log) => {
    if (!log.clockInTime) {
      return <span className="text-sm text-gray-400">--</span>;
    }

    if (log.lateFlag) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
              Late {log.lateMinutes}m
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Expected: {log.shiftStartTime || "09:00"}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <CheckCircle size={14} className="text-green-500" />
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
          On Time
        </span>
      </div>
    );
  };

  // 🆕 Render Early Exit Status
  const renderEarlyExitStatus = (log) => {
    if (!log.clockOutTime) {
      return <span className="text-sm text-gray-400">--</span>;
    }

    if (log.earlyExitFlag && log.earlyExitMinutes > 0) {
      return (
        <div className="flex items-center gap-1">
          <LogOut size={14} className="text-orange-500" />
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
            Early {log.earlyExitMinutes}m
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <CheckCircle size={14} className="text-green-500" />
        <span className="text-xs text-green-600">Full Shift</span>
      </div>
    );
  };

  // 🆕 Render Total Deduction with Breakdown
  const renderDeduction = (log) => {
    const totalDeduction = log.totalDeduction || 0;

    if (totalDeduction === 0) {
      return (
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-sm text-green-600 font-semibold">₹0</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={() => {
            setSelectedLogForDeduction(log);
            setShowDeductionModal(true);
          }}
          className="flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
        >
          <DollarSign size={14} className="text-red-500" />
          <span className="text-sm font-bold text-red-600">₹{totalDeduction}</span>
          <Info size={12} className="text-gray-400" />
        </button>
        
        {/* Quick breakdown badges */}
        <div className="flex flex-wrap gap-1">
          {log.lateDeduction > 0 && (
            <span className="text-xs bg-red-50 text-red-600 px-1 rounded">
              Late: ₹{log.lateDeduction}
            </span>
          )}
          {log.earlyExitDeduction > 0 && (
            <span className="text-xs bg-orange-50 text-orange-600 px-1 rounded">
              Early: ₹{log.earlyExitDeduction}
            </span>
          )}
          {log.absentDeduction > 0 && (
            <span className="text-xs bg-gray-50 text-gray-600 px-1 rounded">
              Absent: ₹{log.absentDeduction}
            </span>
          )}
        </div>
      </div>
    );
  };

  // 🆕 Deduction Breakdown Modal
  const DeductionModal = () => {
    if (!showDeductionModal || !selectedLogForDeduction) return null;

    const log = selectedLogForDeduction;
    const breakdown = log.deductionBreakdown || [];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Deduction Breakdown</h2>
                  <p className="text-red-100 text-sm">
                    {log.employeeInfo?.name || "Your"} - {selectedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeductionModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Total Deduction Card */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-semibold mb-1">Total Deduction</p>
                  <p className="text-4xl font-bold text-red-700">₹{log.totalDeduction || 0}</p>
                </div>
                <div className="p-4 bg-red-200 rounded-full">
                  <TrendingDown size={32} className="text-red-700" />
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-gray-600" />
                  <p className="text-xs text-gray-600 font-semibold">Clock In</p>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {formatTime(log.clockInTime)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Expected: {log.shiftStartTime || "09:00"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <LogOut size={16} className="text-gray-600" />
                  <p className="text-xs text-gray-600 font-semibold">Clock Out</p>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {formatTime(log.clockOutTime)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Work: {log.netWorkHours}h
                </p>
              </div>
            </div>

            {/* Deduction Breakdown */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Penalty Breakdown
              </h3>

              {breakdown.length === 0 ? (
                <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-semibold">No Deductions</p>
                  <p className="text-sm text-green-600">Perfect attendance!</p>
                </div>
              ) : (
                breakdown.map((item, index) => (
                  <div
                    key={index}
                    className={`border-l-4 rounded-lg p-4 ${
                      item.type === 'LATE'
                        ? 'bg-red-50 border-red-500'
                        : item.type === 'EARLY_EXIT'
                        ? 'bg-orange-50 border-orange-500'
                        : item.type === 'HALF_DAY_ABSENT'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-gray-50 border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.type === 'LATE' && <AlertTriangle size={18} className="text-red-500" />}
                        {item.type === 'EARLY_EXIT' && <LogOut size={18} className="text-orange-500" />}
                        {item.type === 'HALF_DAY_ABSENT' && <Timer size={18} className="text-yellow-500" />}
                        {item.type === 'ABSENT' && <XCircle size={18} className="text-gray-500" />}
                        <p className={`font-bold ${
                          item.type === 'LATE'
                            ? 'text-red-700'
                            : item.type === 'EARLY_EXIT'
                            ? 'text-orange-700'
                            : item.type === 'HALF_DAY_ABSENT'
                            ? 'text-yellow-700'
                            : 'text-gray-700'
                        }`}>
                          {item.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <p className={`text-xl font-bold ${
                        item.type === 'LATE'
                          ? 'text-red-700'
                          : item.type === 'EARLY_EXIT'
                          ? 'text-orange-700'
                          : item.type === 'HALF_DAY_ABSENT'
                          ? 'text-yellow-700'
                          : 'text-gray-700'
                      }`}>
                        ₹{item.amount}
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    
                    {item.minutes && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/50 px-3 py-2 rounded">
                        <Timer size={14} />
                        <span>Duration: {item.minutes} minutes</span>
                      </div>
                    )}
                    
                    {item.workMinutes !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/50 px-3 py-2 rounded mt-2">
                        <Clock size={14} />
                        <span>Actual work: {(item.workMinutes / 60).toFixed(2)} hours</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Deduction Rules Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">Deduction Policy:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Late arrival: ₹10/minute (after 15-min grace period)</li>
                    <li>• Early exit: ₹15/minute (before shift end minus grace)</li>
                    <li>• Half-day (&lt;4 hrs work): ₹500 deduction</li>
                    <li>• Full-day absent: ₹1000 deduction</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-end">
            <button
              onClick={() => setShowDeductionModal(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🆕 Deduction Summary Report Modal
  const DeductionSummaryModal = () => {
    if (!showDeductionSummary || !deductionSummary) return null;

    const { summary, deductionReports } = deductionSummary;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Deduction Summary Report</h2>
                  <p className="text-indigo-100 text-sm">{selectedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeductionSummary(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-xs text-red-600 font-semibold mb-1">Total Deductions</p>
                <p className="text-2xl font-bold text-red-700">₹{summary.grandTotalDeductions}</p>
                <p className="text-xs text-red-500 mt-1">{summary.totalRecords} records</p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <p className="text-xs text-orange-600 font-semibold mb-1">Late Penalties</p>
                <p className="text-2xl font-bold text-orange-700">₹{summary.totalLateDeductions}</p>
                <p className="text-xs text-orange-500 mt-1">{summary.lateCount} employees</p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-600 font-semibold mb-1">Early Exit</p>
                <p className="text-2xl font-bold text-yellow-700">₹{summary.totalEarlyExitDeductions}</p>
                <p className="text-xs text-yellow-500 mt-1">{summary.earlyExitCount} cases</p>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-semibold mb-1">Absent</p>
                <p className="text-2xl font-bold text-gray-700">₹{summary.totalAbsentDeductions}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.absentCount} cases</p>
              </div>
            </div>

            {/* Detailed Report Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Late</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Early Exit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Absent</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Work Hrs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deductionReports.map((report, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800">{report.employeeInfo.name}</p>
                          <p className="text-xs text-gray-500">{report.employeeInfo.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3">
                          {report.lateDeduction > 0 ? (
                            <div>
                              <p className="text-sm font-semibold text-red-600">₹{report.lateDeduction}</p>
                              <p className="text-xs text-gray-500">{report.lateMinutes}m</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {report.earlyExitDeduction > 0 ? (
                            <div>
                              <p className="text-sm font-semibold text-orange-600">₹{report.earlyExitDeduction}</p>
                              <p className="text-xs text-gray-500">{report.earlyExitMinutes}m</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {report.absentDeduction > 0 ? (
                            <p className="text-sm font-semibold text-gray-600">₹{report.absentDeduction}</p>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-red-700">₹{report.totalDeduction}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-blue-600 font-semibold">{report.netWorkHours}h</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-between">
            <button
              onClick={() => {/* Export logic */}}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
            >
              <Download size={18} />
              Export Report
            </button>
            <button
              onClick={() => setShowDeductionSummary(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Calendar size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Daily Logs</h1>
              <p className="text-sm text-gray-500">Attendance tracking with deduction compliance</p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="ON_BREAK">On Break</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>

            {/* 🆕 Deduction Report Button */}
            <button 
              onClick={() => setShowDeductionSummary(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
            >
              <FileText size={18} />
              Deduction Report
            </button>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-gray-500" />
                <p className="text-xs text-gray-600 font-semibold">Total</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{summary.totalEmployees}</p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-green-600" />
                <p className="text-xs text-green-700 font-semibold">Present</p>
              </div>
              <p className="text-xl font-bold text-green-700">{summary.present}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-blue-600" />
                <p className="text-xs text-blue-700 font-semibold">Checked In</p>
              </div>
              <p className="text-xl font-bold text-blue-700">{summary.checkedIn}</p>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Coffee size={16} className="text-orange-600" />
                <p className="text-xs text-orange-700 font-semibold">On Break</p>
              </div>
              <p className="text-xl font-bold text-orange-700">{summary.onBreak}</p>
            </div>

            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-indigo-600" />
                <p className="text-xs text-indigo-700 font-semibold">Checked Out</p>
              </div>
              <p className="text-xl font-bold text-indigo-700">{summary.checkedOut}</p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-purple-600" />
                <p className="text-xs text-purple-700 font-semibold">On Leave</p>
              </div>
              <p className="text-xl font-bold text-purple-700">{summary.leaves}</p>
            </div>

            {/* 🆕 ENHANCED LATE EMPLOYEES CARD */}
            <div 
              onClick={() => setShowDeductionSummary(true)}
              className="bg-red-50 p-3 rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-600" />
                <p className="text-xs text-red-700 font-semibold">Late Arrivals</p>
              </div>
              <p className="text-xl font-bold text-red-700">{summary.lateEmployees}</p>
              <p className="text-xs text-red-600 mt-1">Click to view report</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-gray-600" />
                <p className="text-xs text-gray-600 font-semibold">Not Clocked In</p>
              </div>
              <p className="text-xl font-bold text-gray-700">{summary.notClockedIn}</p>
            </div>
          </div>
        )}
      </div>

      {/* 🆕 Deduction Summary Stats Banner */}
      {deductionSummary && deductionSummary.summary && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Today's Deductions</h3>
                <p className="text-sm text-gray-600">Total penalties applied for {selectedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-700">
                  ₹{deductionSummary.summary.grandTotalDeductions}
                </p>
                <p className="text-xs text-gray-600">Total Deductions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-600">
                  {deductionSummary.summary.lateCount}
                </p>
                <p className="text-xs text-gray-600">Late Cases</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-yellow-600">
                  {deductionSummary.summary.earlyExitCount}
                </p>
                <p className="text-xs text-gray-600">Early Exits</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading daily logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No logs found</h3>
          <p className="text-gray-500">No attendance records for selected date and filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  {userRole !== "employee" && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Employee
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Clock In
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Clock Out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Breaks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Work Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Overtime
                  </th>
                  {/* 🆕 LATE STATUS COLUMN */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Late
                    </div>
                  </th>
                  {/* 🆕 EARLY EXIT COLUMN */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      <LogOut size={14} />
                      Early Exit
                    </div>
                  </th>
                  {/* 🆕 TOTAL DEDUCTION COLUMN */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      Deduction
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 transition-colors ${
                      log.lateFlag || log.earlyExitFlag || (log.totalDeduction > 0) 
                        ? 'bg-red-50/20' 
                        : ''
                    }`}
                  >
                    {userRole !== "employee" && (
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {log.employeeInfo?.name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">{log.employeeInfo?.employeeCode}</p>
                          <p className="text-xs text-gray-400">{log.employeeInfo?.department}</p>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-800">{formatTime(log.clockInTime)}</p>
                        {log.clockInTime && (
                          <p className="text-xs text-gray-500">
                            {new Date(log.clockInTime).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800">{formatTime(log.clockOutTime)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Coffee size={14} className="text-orange-500" />
                        <span className="text-sm text-gray-800">
                          {log.breakSummary?.totalBreaks || 0} ({log.breakSummary?.totalBreakHours || 0}h)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-blue-600">
                        {log.netWorkHours}h
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {parseFloat(log.overtimeHours) > 0 ? (
                        <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                          <TrendingUp size={14} />
                          {log.overtimeHours}h
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">--</span>
                      )}
                    </td>
                    {/* 🆕 LATE STATUS CELL */}
                    <td className="px-4 py-3">
                      {renderLateStatus(log)}
                    </td>
                    {/* 🆕 EARLY EXIT CELL */}
                    <td className="px-4 py-3">
                      {renderEarlyExitStatus(log)}
                    </td>
                    {/* 🆕 TOTAL DEDUCTION CELL */}
                    <td className="px-4 py-3">
                      {renderDeduction(log)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-4 py-3">
                      {log.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-indigo-500" />
                          <span className="text-xs text-gray-600">
                            {log.location.officeTag || "Unknown"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm font-semibold text-gray-700">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🆕 MODALS */}
      <DeductionModal />
      <DeductionSummaryModal />
    </div>
  );
};

export default DailyLogs;