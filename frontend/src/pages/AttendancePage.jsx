import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AttendanceLayout from "../layouts/AttendanceLayout";
import AttendanceTopBar from "../components/attendance/AttendanceTopBar";
import AttendanceTabs from "../components/attendance/AttendanceTabs";
import DailyLogs from "../components/attendance/DailyLogs";
import LeaveRequests from "../components/attendance/LeaveRequests";
import SalaryManagement from "../components/attendance/SalaryManagement";

const AttendancePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dailyLogs");

  return (
    <AttendanceLayout>
      <AttendanceTopBar />
      <AttendanceTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-6">
        {/* ✅ Don't pass apiUrl - let DailyLogs handle it internally */}
        {activeTab === "dailyLogs" && <DailyLogs />}
        {activeTab === "leaveRequests" && <LeaveRequests />}
        {activeTab === "salaryManagement" && <SalaryManagement />}
      </div>
    </AttendanceLayout>
  );
};

export default AttendancePage;