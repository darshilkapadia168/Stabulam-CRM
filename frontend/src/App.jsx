import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import EmployeePage from "./pages/EmployeePage"; 
import { useAuth } from "./context/AuthContext";
import EmployeeForm from "./components/employee/EmployeeForm";
import AttendancePage from "./pages/AttendancePage";
import WorkplaceLocations from "./pages/WorkplaceLocation";
import PayrollSettings from "./pages/PayrollSettings";
import Unauthorized from "./components/attendance/Unauthorized";

// ✅ NEW: Import AllDailyLogsPage
import AllDailyLogsPage from "../src/components/attendance/AllDailyLogsPage";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Role-based protection
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }
  
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* PROTECTED DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* User Management - ACCESSIBLE TO ALL AUTHENTICATED USERS */}
        <Route path="users" element={<UserManagement />} />

        {/* Unauthorized Page */}
        <Route path="unauthorized" element={<Unauthorized />} />

        {/* EMPLOYEE MANAGEMENT - ACCESSIBLE TO ALL AUTHENTICATED USERS */}
        <Route path="employees/profiles" element={<EmployeePage />} />
        
        {/* Employee Create - Admin Only */}
        <Route 
          path="employees/create" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <EmployeePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Employee Edit - Admin Only */}
        <Route 
          path="employees/edit/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <EmployeeForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Employee Details - Accessible to all */}
        <Route path="employees/:id" element={<EmployeePage />} />

        {/* ============================
            ATTENDANCE ROUTES - FIXED
            ============================ */}
        
        {/* ✅ Admin Only - All Daily Logs (ALL users' attendance) */}
        <Route 
          path="attendance/all-daily-logs" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AllDailyLogsPage />
            </ProtectedRoute>
          } 
        />

        {/* ✅ Main Attendance Page - Shows logged-in user's own attendance */}
        {/* Accessible to ALL authenticated users (employees, admin, super_admin) */}
        <Route path="attendance" element={<AttendancePage />} />
        
        {/* ✅ Admin Only - Payroll Settings */}
        <Route 
          path="attendance/payroll-settings" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <PayrollSettings />
            </ProtectedRoute>
          } 
        />
        
        {/* ✅ Workplace Locations - Accessible to all authenticated users */}
        <Route path="attendance/workplace-locations" element={<WorkplaceLocations />} />
      </Route>

      {/* REDIRECTS */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}