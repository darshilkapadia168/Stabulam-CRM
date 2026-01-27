import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  Coffee,
  Filter,
  Download,
  FileText,
  Search,
  Building2,
  X,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import DeductionModal from "../attendance/DeductionModal";
import DeductionSummaryModal from "../attendance/DeductionSummaryModal";
import AttendanceDetailModal from "../attendance/AttendanceDetailModal";
import DailyLogsTable from "../attendance/DailyLogsTable";

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api`;

const AdminDailyLogs = () => {
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingDeductionSummary, setLoadingDeductionSummary] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [payrollSettings, setPayrollSettings] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [selectedLogForDeduction, setSelectedLogForDeduction] = useState(null);
  
  const [deductionSummary, setDeductionSummary] = useState(null);
  const [showDeductionSummary, setShowDeductionSummary] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    startDate: '',
    endDate: '',
    employeeId: '',
    departmentId: '',
    status: 'all',
    name: ''
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // ✅ Get token and validate on component mount
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    
    console.log("🔑 Token exists:", !!token);
    console.log("👤 User Role:", userRole);
    
    if (!token) {
      console.error("❌ No token found - redirecting to login");
      navigate("/login");
      return null;
    }
    
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // ✅ Get user role
  const userRole = localStorage.getItem("role") || "admin";

  // ✅ Fetch Admin Daily Logs with token validation
  const fetchAdminDailyLogs = async () => {
    setLoading(true);
    try {
      const axiosConfig = getAuthConfig();
      if (!axiosConfig) return;

      const params = {
        page,
        limit: 50,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      if (filters.date) params.date = filters.date;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.employeeId) params.employeeId = filters.employeeId;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.name) params.name = filters.name;

      console.log("📡 Fetching admin daily logs...");
      const res = await axios.get(`${API_BASE}/daily-logs/admin/all`, {
        ...axiosConfig,
        params,
      });

      setLogs(res.data.data.logs || []);
      setStatistics(res.data.data.statistics);
      setPagination(res.data.data.pagination);
      console.log("✅ Admin daily logs loaded");
    } catch (error) {
      console.error("❌ Error fetching admin daily logs:", error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Payroll Settings with token validation
  const fetchPayrollSettings = async () => {
    try {
      const axiosConfig = getAuthConfig();
      if (!axiosConfig) return;

      const res = await axios.get(`${API_BASE}/daily-logs/deduction-rules`, axiosConfig);
      setPayrollSettings(res.data.data);
      console.log("✅ Payroll settings loaded");
    } catch (error) {
      console.error("❌ Error fetching payroll settings:", error);
      handleAuthError(error);
    }
  };

  // ✅ UPDATED: Fetch Deduction Summary with proper error handling
  const fetchDeductionSummary = async () => {
    setLoadingDeductionSummary(true);
    try {
      const axiosConfig = getAuthConfig();
      if (!axiosConfig) return null;

      const params = {};
      
      // ✅ Only send date parameter if explicitly set by user
      if (filters.date) {
        params.date = filters.date;
        console.log("📅 Using filtered date:", filters.date);
      } else if (filters.startDate && filters.endDate) {
        params.date = filters.startDate;
        console.log("📅 Using date range start:", filters.startDate);
      }
      // ✅ If no date is set, backend will use today by default
      
      console.log("📊 Fetching deduction summary with params:", params);
      
      const res = await axios.get(`${API_BASE}/daily-logs/deduction-summary`, {
        ...axiosConfig,
        params,
      });
      
      console.log("✅ Deduction summary response:", res.data);
      
      // ✅ Validate response structure
      if (res.data.success && res.data.data) {
        setDeductionSummary(res.data.data);
        console.log("✅ Deduction summary loaded successfully");
        console.log("📊 Total Records:", res.data.data.summary.totalRecords);
        console.log("💰 Total Deductions:", res.data.data.summary.grandTotalDeductions);
        console.log("🎁 Total Bonuses:", res.data.data.summary.totalOvertimeBonuses);
        console.log("👥 Unique Employees:", res.data.data.summary.uniqueEmployees);
        return res.data.data;
      } else {
        console.error("⚠️ Invalid response structure:", res.data);
        throw new Error("Invalid response structure from server");
      }
    } catch (error) {
      console.error("❌ Error fetching deduction summary:", error);
      console.error("Response data:", error.response?.data);
      
      // ✅ Handle 500 errors gracefully
      if (error.response?.status === 500) {
        console.error("Server error details:", error.response.data);
        
        const errorMsg = error.response.data?.message || "Internal server error";
        alert(
          `Unable to load deduction summary.\n\n` +
          `Error: ${errorMsg}\n\n` +
          `This might be due to:\n` +
          `• No attendance data for the selected date\n` +
          `• Missing employee records\n` +
          `• Server configuration issues\n\n` +
          `Please check the server logs or try a different date.`
        );
        
        // ✅ Set empty deduction summary to prevent UI crashes
        setDeductionSummary({
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
        });
        
        return null;
      } else {
        handleAuthError(error);
        return null;
      }
    } finally {
      setLoadingDeductionSummary(false);
    }
  };

  // ✅ Fetch Employees with token validation
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const axiosConfig = getAuthConfig();
      if (!axiosConfig) return;

      const res = await axios.get(`${API_BASE}/users`, axiosConfig);
      const allEmployees = res.data.data || [];
      setEmployees(allEmployees);
      
      const uniqueDepts = [...new Set(
        allEmployees.map(emp => emp.department).filter(Boolean)
      )];
      setDepartments(uniqueDepts);
      console.log("✅ Employees loaded:", allEmployees.length);
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      handleAuthError(error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ✅ Handle authentication errors
  const handleAuthError = (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Unknown error';
      
      console.error(`HTTP ${status}:`, message);
      
      if (status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate("/login");
      } else if (status === 403) {
        alert("Access Denied: You don't have permission to access this resource.");
        navigate("/unauthorized");
      } else if (status === 400) {
        console.error("Bad Request:", message);
        alert(`Invalid request: ${message}`);
      } else if (status !== 500) {
        // Don't alert for 500 errors (handled separately)
        alert(`Error: ${message}`);
      }
    } else if (error.request) {
      console.error("No response from server");
      alert("Cannot connect to server. Please check your internet connection.");
    } else {
      console.error("Error:", error.message);
      alert("An unexpected error occurred.");
    }
  };

  // ✅ Initial Load - validate token first
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.error("❌ No token found on mount - redirecting to login");
      navigate("/login");
      return;
    }

    console.log("🚀 AdminDailyLogs mounted - loading data...");
    fetchPayrollSettings();
    fetchEmployees();
    // ✅ Don't fetch deduction summary on mount - only when user clicks button
  }, []);

  // ✅ Fetch when page changes
  useEffect(() => {
    fetchAdminDailyLogs();
  }, [page]);

  // ✅ Reset to page 1 when filters change (with debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchAdminDailyLogs();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  // ✅ Socket connection
  useEffect(() => {
    const socket = io(API_URL);

    socket.on("connect", () => console.log("⚡ Admin Daily Logs Connected"));
    socket.on("attendance:update", () => {
      console.log("📡 Attendance updated - refreshing logs");
      fetchAdminDailyLogs();
      // Only refresh deduction summary if modal is open
      if (showDeductionSummary) {
        fetchDeductionSummary();
      }
    });

    return () => socket.disconnect();
  }, [showDeductionSummary]);

  // ✅ Handle Filter Change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // ✅ Clear All Filters
  const handleClearFilters = () => {
    setFilters({
      date: '',
      startDate: '',
      endDate: '',
      employeeId: '',
      departmentId: '',
      status: 'all',
      name: ''
    });
  };

  // ✅ Handle Page Change
  const handlePageChange = (newPage) => {
    console.log('🔄 Page change:', newPage);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Handle View Details with token validation
  const handleViewDetails = async (log) => {
    const logId = log._id || log.id;

    if (!logId) {
      console.error("❌ Missing logId", log);
      alert("Attendance ID missing. Please refresh.");
      return;
    }

    setLoadingDetail(true);
    
    try {
      const axiosConfig = getAuthConfig();
      if (!axiosConfig) return;

      const response = await axios.get(
        `${API_BASE}/daily-logs/details/${logId}`,
        axiosConfig
      );

      setSelectedLog(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("❌ Error fetching attendance details:", error);
      handleAuthError(error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ✅ UPDATED: Handle Deduction Report Button Click
  const handleDeductionReportClick = async () => {
    console.log("🔘 Deduction Report button clicked");
    
    // ✅ Fetch fresh deduction summary data
    const result = await fetchDeductionSummary();
    
    // ✅ Only open modal if data was successfully fetched
    if (result !== null) {
      setShowDeductionSummary(true);
    }
  };

  const hasActiveFilters = 
    filters.date || 
    filters.startDate || 
    filters.endDate || 
    filters.employeeId || 
    filters.departmentId || 
    filters.name ||
    (filters.status && filters.status !== 'all');

  return (
    <div className="p-6 max-w-full bg-gray-50 min-h-screen">
      <div className="mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Calendar size={24} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">All Employees Daily Logs</h1>
              <p className="text-sm text-gray-500">
                View and manage attendance records for all employees
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* ✅ UPDATED: Deduction Report Button with Loading State */}
            <button 
              onClick={handleDeductionReportClick}
              disabled={loadingDeductionSummary}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {loadingDeductionSummary ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Deduction Report
                </>
              )}
            </button>
            {/* <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
              <Download size={18} />
              Export
            </button> */}
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-gray-500" />
                <p className="text-xs text-gray-600 font-semibold">Total Records</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-blue-600" />
                <p className="text-xs text-blue-600 font-semibold">Checked In</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{statistics.checkedIn}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Coffee size={16} className="text-orange-600" />
                <p className="text-xs text-orange-600 font-semibold">On Break</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{statistics.onBreak}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-green-600" />
                <p className="text-xs text-green-600 font-semibold">Checked Out</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{statistics.checkedOut}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-purple-600" />
                <p className="text-xs text-purple-600 font-semibold">On Leave</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">{statistics.onLeave}</p>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white border border-gray-200 rounded-lg mb-4">
          {/* Filter Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                  Active
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Filter Content */}
          {showFilters && (
            <div className="p-4 space-y-4">
              {/* Date Range Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Single Date
                  </label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange({ 
                      date: e.target.value,
                      startDate: '',
                      endDate: ''
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange({ 
                      startDate: e.target.value,
                      date: '' 
                    })}
                    disabled={!!filters.date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange({ 
                      endDate: e.target.value,
                      date: '' 
                    })}
                    disabled={!!filters.date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              {/* Search & Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search Employee
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Users className="w-4 h-4 inline mr-1" />
                    Select Employee
                  </label>
                  <select
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange({ employeeId: e.target.value })}
                    disabled={loadingEmployees}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 transition-all"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} - {emp.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Department
                  </label>
                  <select
                    value={filters.departmentId}
                    onChange={(e) => handleFilterChange({ departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange({ status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="CHECKED_IN">Checked In</option>
                    <option value="ON_BREAK">On Break</option>
                    <option value="CHECKED_OUT">Checked Out</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.date && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1.5 font-medium">
                        Date: {filters.date}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-indigo-900" 
                          onClick={() => handleFilterChange({ date: '' })}
                        />
                      </span>
                    )}
                    {filters.startDate && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1.5 font-medium">
                        From: {filters.startDate}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-indigo-900" 
                          onClick={() => handleFilterChange({ startDate: '' })}
                        />
                      </span>
                    )}
                    {filters.endDate && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1.5 font-medium">
                        To: {filters.endDate}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-indigo-900" 
                          onClick={() => handleFilterChange({ endDate: '' })}
                        />
                      </span>
                    )}
                    {filters.name && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1.5 font-medium">
                        Search: {filters.name}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-green-900" 
                          onClick={() => handleFilterChange({ name: '' })}
                        />
                      </span>
                    )}
                    {filters.employeeId && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1.5 font-medium">
                        Employee Selected
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-blue-900" 
                          onClick={() => handleFilterChange({ employeeId: '' })}
                        />
                      </span>
                    )}
                    {filters.departmentId && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1.5 font-medium">
                        Dept: {filters.departmentId}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-purple-900" 
                          onClick={() => handleFilterChange({ departmentId: '' })}
                        />
                      </span>
                    )}
                    {filters.status && filters.status !== 'all' && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1.5 font-medium">
                        Status: {filters.status}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-orange-900" 
                          onClick={() => handleFilterChange({ status: 'all' })}
                        />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading daily logs...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait while we fetch the data</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No attendance records found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or date range</p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <DailyLogsTable
            logs={logs}
            userRole={userRole}
            showAllDays={true}
            showEmployeeColumn={true}
            onViewDetails={handleViewDetails}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modals */}
      <DeductionModal
        isOpen={showDeductionModal}
        onClose={() => setShowDeductionModal(false)}
        log={selectedLogForDeduction}
        payrollSettings={payrollSettings}
      />

      {/* ✅ UPDATED: Pass payrollSettings to modal */}
      <DeductionSummaryModal
        isOpen={showDeductionSummary}
        onClose={() => setShowDeductionSummary(false)}
        deductionSummary={deductionSummary}
        viewMode="single"
        selectedDate={filters.date || new Date().toISOString().split('T')[0]}
        payrollSettings={payrollSettings}
      />

      {showDetailModal && selectedLog && (
        <>
          {loadingDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Loading details...</p>
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

export default AdminDailyLogs;