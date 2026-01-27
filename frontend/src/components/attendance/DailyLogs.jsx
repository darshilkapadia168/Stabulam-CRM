// components/DailyLogs.jsx - FIXED VERSION WITH BETTER ERROR HANDLING

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Calendar, AlertCircle } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import DeductionModal from "./DeductionModal";
import DeductionSummaryModal from "./DeductionSummaryModal";
import AttendanceDetailModal from "./AttendanceDetailModal";
import DailyLogsTable from "./DailyLogsTable";

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api`;

const DailyLogs = () => {
  const navigate = useNavigate();
  
  const { user, token } = useAuth();
  const userRole = (user?.role || "employee").toLowerCase().trim();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [showAllDays, setShowAllDays] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [payrollSettings, setPayrollSettings] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [selectedLogForDeduction, setSelectedLogForDeduction] = useState(null);
  
  const [deductionSummary, setDeductionSummary] = useState(null);
  const [showDeductionSummary, setShowDeductionSummary] = useState(false);

  // ✅ Error state
  const [errors, setErrors] = useState({
    logs: null,
    summary: null,
    settings: null
  });

  const axiosConfig = { 
    headers: { 
      Authorization: `Bearer ${token}` 
    } 
  };

  const isAdminRole = (role) => {
    return ['admin', 'super_admin', 'superadmin'].includes(role);
  };

  const isAdmin = isAdminRole(userRole);

  const fetchDailyLogs = async () => {
    setLoading(true);
    setErrors(prev => ({ ...prev, logs: null }));
    
    try {
      if (!token) {
        console.error("❌ No authentication token found");
        navigate('/login');
        return;
      }

      const params = { page, limit: 30 };

      if (!showAllDays && selectedDate) {
        params.date = selectedDate;
      }

      if (filterStatus !== "all") {
        params.status = filterStatus;
      }

      const endpoint = `${API_BASE}/daily-logs/my-logs`;

      console.log("📡 Fetching Daily Logs:", endpoint);

      const res = await axios.get(endpoint, { ...axiosConfig, params });

      setLogs(res.data.data.logs || []);
      setPagination(res.data.data.pagination);
      
      console.log(`✅ Successfully loaded ${res.data.data.logs?.length || 0} logs`);
    } catch (error) {
      console.error("❌ Error fetching daily logs:", error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch logs';
      setErrors(prev => ({ ...prev, logs: errorMessage }));
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 403) {
          console.error("🚫 403 Details:", {
            role: userRole,
            endpoint: error.config?.url,
            message: data.message
          });
        } else if (status === 401) {
          alert("Session expired. Please login again.");
          localStorage.clear();
          navigate('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollSettings = async () => {
    // Only fetch for admins - employees don't need this
    if (!isAdmin) return;
    
    setErrors(prev => ({ ...prev, settings: null }));
    
    try {
      const res = await axios.get(`${API_BASE}/daily-logs/deduction-rules`, axiosConfig);
      setPayrollSettings(res.data.data);
      console.log("✅ Payroll settings loaded");
    } catch (error) {
      console.error("⚠️ Error fetching payroll settings:", error);
      const errorMessage = error.response?.data?.message || 'Failed to load settings';
      setErrors(prev => ({ ...prev, settings: errorMessage }));
      
      // ✅ Don't fail silently - settings are optional but helpful
      console.warn("Continuing without payroll settings");
    }
  };

  const fetchDeductionSummary = async () => {
    setErrors(prev => ({ ...prev, summary: null }));
    
    try {
      // ✅ FIX: Better date handling
      let dateParam;
      if (!showAllDays && selectedDate) {
        dateParam = selectedDate;
      } else {
        // For "all days" view, send startDate and endDate instead of single date
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        
        const res = await axios.get(`${API_BASE}/daily-logs/deduction-summary`, { 
          ...axiosConfig, 
          params: { startDate, endDate }
        });
        
        setDeductionSummary(res.data.data);
        console.log("✅ Deduction summary loaded (range)");
        return;
      }
      
      const res = await axios.get(`${API_BASE}/daily-logs/deduction-summary`, { 
        ...axiosConfig, 
        params: { date: dateParam }
      });
      
      setDeductionSummary(res.data.data);
      console.log("✅ Deduction summary loaded (single date)");
    } catch (error) {
      console.error("⚠️ Error fetching deduction summary:", error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load summary';
      setErrors(prev => ({ ...prev, summary: errorMessage }));
      
      // ✅ FIX: Provide more context about the error
      if (error.response?.status === 500) {
        console.error("🔴 Server Error Details:", {
          status: 500,
          message: error.response?.data?.message,
          endpoint: error.config?.url,
          params: error.config?.params
        });
        
        // Set a fallback empty summary so UI doesn't break
        setDeductionSummary({
          summary: {
            grandTotalDeductions: 0,
            totalLateDeductions: 0,
            totalEarlyExitDeductions: 0,
            totalAbsentDeductions: 0,
            totalBreakPenalties: 0,
            totalOvertimeBonuses: 0,
            totalRecords: 0,
            lateCount: 0,
            earlyExitCount: 0,
            absentCount: 0,
            overtimeCount: 0
          },
          deductionReports: []
        });
      }
    }
  };

  const showLast40Days = () => {
    setShowAllDays(true);
    setSelectedDate("");
    setPage(1);
  };

  const showSingleDay = (date) => {
    setShowAllDays(false);
    setSelectedDate(date || new Date().toISOString().split("T")[0]);
    setPage(1);
  };

  const goToToday = () => {
    showSingleDay(new Date().toISOString().split("T")[0]);
  };

  useEffect(() => {
    if (!user || !token) {
      console.error("❌ No user or token - redirecting to login");
      navigate('/login');
      return;
    }

    console.log("🔍 Component Initialized - Role:", userRole, "| Is Admin:", isAdmin);
    fetchPayrollSettings();
    fetchDailyLogs();
    fetchDeductionSummary();
  }, [page]); // eslint-disable-line

  useEffect(() => {
    setPage(1);
  }, [selectedDate, filterStatus, showAllDays]);

  // ✅ Re-fetch when view mode changes
  useEffect(() => {
    if (user && token) {
      fetchDailyLogs();
      fetchDeductionSummary();
    }
  }, [showAllDays, selectedDate]); // eslint-disable-line

  useEffect(() => {
    const socket = io(API_URL);
    socket.on("connect", () => console.log("⚡ Daily Logs Connected"));
    socket.on("attendance:update", () => {
      console.log("📡 Attendance updated - refreshing logs");
      fetchDailyLogs();
      fetchDeductionSummary();
    });
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = async (log) => {
    const logId = log._id || log.id;
    if (!logId) {
      alert("Attendance ID missing. Please refresh.");
      return;
    }

    setLoadingDetail(true);
    try {
      const response = await axios.get(
        `${API_BASE}/daily-logs/details/${logId}`, 
        axiosConfig
      );
      setSelectedLog(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching details:", error);
      alert(
        error.response?.status === 403 
          ? "You don't have permission to view this record." 
          : "Failed to load details."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const pageTitle = "My Daily Logs";
  const pageSubtitle = showAllDays 
    ? "Your attendance records for the last 40 days" 
    : `Your attendance for ${selectedDate}`;

  return (
    <div className="p-6 max-w-full bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Calendar size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
              <p className="text-sm text-gray-500">{pageSubtitle}</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button 
                onClick={showLast40Days} 
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  showAllDays 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Last 40 Days
              </button>
              <button 
                onClick={goToToday} 
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  !showAllDays 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Single Day
              </button>
            </div>

            {!showAllDays && (
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => showSingleDay(e.target.value)} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            )}

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
          </div>
        </div>

        {/* ✅ Error Messages */}
        {(errors.logs || errors.summary || errors.settings) && (
          <div className="mb-4 space-y-2">
            {errors.logs && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Failed to load daily logs</p>
                    <p className="text-xs text-red-600">{errors.logs}</p>
                  </div>
                </div>
              </div>
            )}
            {errors.summary && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} className="text-yellow-600" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Deduction summary unavailable</p>
                    <p className="text-xs text-yellow-600">{errors.summary}</p>
                  </div>
                </div>
              </div>
            )}
            {errors.settings && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Payroll settings not loaded</p>
                    <p className="text-xs text-blue-600">{errors.settings}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading daily logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">No attendance records found</p>
          <p className="text-sm text-gray-500 mt-2">
            {showAllDays 
              ? "No logs in the last 40 days" 
              : `No logs for ${selectedDate}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <DailyLogsTable 
            logs={logs} 
            userRole={userRole} 
            showAllDays={showAllDays} 
            onViewDetails={handleViewDetails} 
            pagination={pagination} 
            onPageChange={handlePageChange} 
          />
        </div>
      )}

      <DeductionModal 
        isOpen={showDeductionModal} 
        onClose={() => setShowDeductionModal(false)} 
        log={selectedLogForDeduction} 
        payrollSettings={payrollSettings} 
      />
      
      <DeductionSummaryModal 
        isOpen={showDeductionSummary} 
        onClose={() => setShowDeductionSummary(false)} 
        deductionSummary={deductionSummary} 
        viewMode={showAllDays ? 'all' : 'single'} 
        selectedDate={selectedDate}
        payrollSettings={payrollSettings}
      />

      {showDetailModal && selectedLog && (
        <>
          {loadingDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading details...</p>
              </div>
            </div>
          )}
          {!loadingDetail && (
            <AttendanceDetailModal 
              log={selectedLog} 
              onClose={() => { 
                setShowDetailModal(false); 
                setSelectedLog(null); 
              }} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default DailyLogs;