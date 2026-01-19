// StatusIndicator.jsx
import React from "react";

const StatusIndicator = ({ status }) => {
  // Handle null/undefined status (not clocked in yet)
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        Not Clocked In
      </span>
    );
  }

  const statusConfig = {
    CHECKED_IN: {
      label: "Checked In",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      dotColor: "bg-green-500",
      borderColor: "border-green-200",
    },
    ON_BREAK: {
      label: "On Break",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      dotColor: "bg-orange-500",
      borderColor: "border-orange-200",
    },
    CHECKED_OUT: {
      label: "Checked Out",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      dotColor: "bg-blue-500",
      borderColor: "border-blue-200",
    },
    ON_LEAVE: {
      label: "On Leave",
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      dotColor: "bg-purple-500",
      borderColor: "border-purple-200",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    dotColor: "bg-gray-500",
    borderColor: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`}></span>
      {config.label}
    </span>
  );
};

export default StatusIndicator;