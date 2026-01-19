import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Check, 
  X, 
  Plus, 
  User 
} from "lucide-react";
import LeaveRequestForm from "./LeaveRequestForm";

const LeaveRequests = () => {
  const [userRole, setUserRole] = useState("admin");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const leaveRequests = [
    { id: 1, employeeName: "John Smith", requestType: "Full Day", startDate: "2025-01-10", endDate: "2025-01-12", reason: "Family vacation", status: "Pending", adminComment: "" },
    { id: 2, employeeName: "Sarah Johnson", requestType: "Half Day", startDate: "2025-01-15", endDate: "2025-01-15", reason: "Doctor appointment", status: "Approved", adminComment: "Approved as per policy" },
    { id: 4, employeeName: "Emily Davis", requestType: "Long Day", startDate: "2025-01-20", endDate: "2025-01-25", reason: "Personal reasons", status: "Rejected", adminComment: "Not enough leave balance" },
    { id: 5, employeeName: "John Smith", requestType: "Full Day", startDate: "2025-01-05", endDate: "2025-01-05", reason: "Personal work", status: "Approved", adminComment: "" },
  ];

  const filteredRequests = leaveRequests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status.toLowerCase() === filterStatus;
    const matchesSearch = userRole === "admin" ? req.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved": return "bg-green-50 text-green-700 border-green-200";
      case "Rejected": return "bg-red-50 text-red-700 border-red-200";
      case "Pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getRequestTypeBadge = (type) => {
    switch (type) {
      case "Emergency": return "bg-red-50 text-red-700 border-red-200";
      case "Long Day": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Half Day": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Leave Management</h1>
            <p className="text-sm text-gray-600 font-medium">Manage and track leave requests efficiently</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-2xl">
            <User size={16} className="text-gray-500" />
            <button onClick={() => setUserRole("employee")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${userRole === "employee" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Employee</button>
            <button onClick={() => setUserRole("admin")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${userRole === "admin" ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Admin</button>
          </div>
        </div>

        {/* Employee Apply Card - LIGHT THEME UPDATE */}
        {userRole === "employee" && (
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Need Time Off?</h2>
              <p className="text-gray-500 text-sm font-medium">Submit your leave request in just a few clicks</p>
            </div>
            <button onClick={() => setShowApplyForm(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
              <Plus size={20} /> Apply for Leave
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md flex flex-col lg:flex-row items-center justify-between gap-4">
          {userRole === "admin" && (
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search employee..." className="w-full bg-white border-2 border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={18} className="text-gray-500" />
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${filterStatus === status ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                {userRole === "admin" && <th className="px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Employee</th>}
                <th className="px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                  {userRole === "admin" && <td className="px-6 py-4 font-bold text-gray-900">{request.employeeName}</td>}
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-tighter ${getRequestTypeBadge(request.requestType)}`}>
                      {request.requestType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{request.startDate} - {request.endDate}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* ADMIN ACTIONS: Icons for Approve and Reject */}
                      {userRole === "admin" && request.status === "Pending" ? (
                        <>
                          <button 
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-100 transition-all active:scale-90"
                            title="Approve"
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                          <button 
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-100 transition-all active:scale-90"
                            title="Reject"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        </>
                      ) : (
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <MessageSquare size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Render */}
        {showApplyForm && (
          <LeaveRequestForm 
            onClose={() => setShowApplyForm(false)} 
            onSubmit={(e) => { e.preventDefault(); setShowApplyForm(false); }} 
          />
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;