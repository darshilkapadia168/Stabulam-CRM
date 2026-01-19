import { useState } from "react";
import AttendanceLayout from "../layouts/AttendanceLayout";
import AttendanceTopBar from "../components/attendance/AttendanceTopBar";
import AttendanceTabs from "../components/attendance/AttendanceTabs";
import DailyLogs from "../components/attendance/DailyLogs";
import LeaveRequests from "../components/attendance/LeaveRequests";
import SalaryManagement from "../components/attendance/SalaryManagement";

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState("dailyLogs");

  return (
    <AttendanceLayout>
      <AttendanceTopBar />
      <AttendanceTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="mt-6">
        {activeTab === "dailyLogs" && <DailyLogs />}
        {activeTab === "leaveRequests" && <LeaveRequests />}
        {activeTab === "salaryManagement" && <SalaryManagement />}
      </div>
    </AttendanceLayout>
  );
};

export default AttendancePage;
