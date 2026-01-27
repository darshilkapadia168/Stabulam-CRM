import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  UserRoundCog,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Settings,
  FileText,
  ClipboardList,
  Calendar
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  // ✅ Role-based access control
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);
  const isEmployee = ['employee', 'sr_employee', 'jr_employee', 'intern', 'management'].includes(user?.role);

  // Auto-expand attendance dropdown if on attendance route
  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/attendance")) {
      setAttendanceOpen(true);
    }
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative group ${
      isActive
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
    }`;

  const subNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 ml-8 rounded-lg transition-all duration-200 relative ${
      isActive
        ? "bg-indigo-500 text-white"
        : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
    }`;

  const activeIndicator = (isActive) => 
    isActive && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-400 rounded-r-full" />
    );

  const isAttendancePath = location.pathname.startsWith("/dashboard/attendance");

  return (
    <aside className="w-64 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl shrink-0">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-slate-700/50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Admin Panel
        </h1>
        <p className="text-slate-400 text-sm mt-1">Management System</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        
        {/* Dashboard */}
        <NavLink to="/dashboard" end className={navLinkClass}>
          {({ isActive }) => (
            <>
              {activeIndicator(isActive)}
              <LayoutDashboard className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
              <span className="font-medium">Dashboard</span>
            </>
          )}
        </NavLink>

        {/* User Management - VISIBLE TO ALL USERS */}
        <NavLink to="/dashboard/users" className={navLinkClass}>
          {({ isActive }) => (
            <>
              {activeIndicator(isActive)}
              <Users className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
              <span className="font-medium">User Management</span>
            </>
          )}
        </NavLink>

        {/* Employee Management - VISIBLE TO ALL USERS */}
        <NavLink to="/dashboard/employees/profiles" className={navLinkClass}>
          {({ isActive }) => (
            <>
              {activeIndicator(isActive)}
              <UserRoundCog className={`w-[22px] h-[22px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
              <span className="font-medium">Employee Mgmt</span>
            </>
          )}
        </NavLink>

        {/* Attendance Management - ROLE-BASED DROPDOWN */}
        <div>
          {/* Dropdown Toggle Button */}
          <button
            onClick={() => setAttendanceOpen(!attendanceOpen)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative group ${
              isAttendancePath
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              {isAttendancePath && activeIndicator(true)}
              <CalendarCheck className={`w-5 h-5 ${isAttendancePath ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
              <span className="font-medium">Attendance</span>
            </div>
            {attendanceOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Dropdown Menu - ROLE-BASED ITEMS */}
          <div 
            className={`overflow-hidden transition-all duration-300 ${
              attendanceOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-1">

              {/* ADMIN ONLY - All Daily Logs */}
              {isAdmin && (
                <NavLink to="/dashboard/attendance/all-daily-logs" className={subNavLinkClass}>
                  {({ isActive }) => (
                    <>
                      <ClipboardList className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-sm font-medium">All Daily Logs</span>
                    </>
                  )}
                </NavLink>
              )}

              {/* SHARED - Main Attendance Page */}
              <NavLink to="/dashboard/attendance" end className={subNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <Clock className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium">Attendance</span>
                  </>
                )}
              </NavLink>

              {/* ADMIN ONLY - Payroll Settings */}
              {isAdmin && (
                <NavLink to="/dashboard/attendance/payroll-settings" className={subNavLinkClass}>
                  {({ isActive }) => (
                    <>
                      <Settings className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-sm font-medium">Payroll Settings</span>
                    </>
                  )}
                </NavLink>
              )}

              {/* SHARED - Workplace Locations (All users can access) */}
              <NavLink to="/dashboard/attendance/workplace-locations" className={subNavLinkClass}>
                {({ isActive }) => (
                  <>
                    <MapPin className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium">Workplace Locations</span>
                  </>
                )}
              </NavLink>

            </div>
          </div>
        </div>

      </nav>

      {/* User Role Badge */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <Shield className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Role</p>
            <p className="text-sm font-semibold text-white capitalize">
              {user?.role?.replace('_', ' ') || "Admin"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}