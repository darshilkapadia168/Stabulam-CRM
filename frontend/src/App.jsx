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

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
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
        <Route path="users" element={<UserManagement />} />

        {/* EMPLOYEES */}
        <Route path="employees/create" element={<EmployeePage />} />
        <Route path="employees/profiles" element={<EmployeePage />} />
        <Route path="employees/edit/:id" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeePage />} />

        {/* ATTENDANCE */}
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="attendance/payroll-settings" element={<PayrollSettings />} />
        <Route path="attendance/workplace-locations" element={<WorkplaceLocations />} />
      </Route>

      {/* REDIRECTS */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
