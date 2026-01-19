
import React from "react";

const AttendanceTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "dailyLogs", label: "Daily logs" },
    { id: "leaveRequests", label: "Leave requests" },
    { id: "salaryManagement", label: "Salary Management" },
  ];

  return (
    <div className="bg-gray-200 rounded-[50px] border border-gray-200 shadow-sm">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-[50px] transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceTabs;