import React from "react";
import { 
  XCircle, 
  ChevronDown, 
  Calendar, 
  FileText 
} from "lucide-react";

const LeaveRequestForm = ({ onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 1. Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 2. Modal Card */}
      <div className="relative bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Apply for Leave</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Submit your request for approval</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Row 1: Request Type */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-1">Request Type</label>
            <div className="relative">
              <select className="w-full bg-white border-2 border-gray-100 text-gray-900 rounded-xl px-4 py-3 text-sm appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer">
                <option>Full Day</option>
                <option>Half Day</option>
                <option>Long Day</option>
                <option>Emergency</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Row 2: Start Date & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-1">Start Date</label>
              <div className="flex items-center bg-white border-2 border-gray-100 rounded-xl px-4 py-3 gap-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Calendar size={16} className="text-gray-400" />
                <input 
                  type="date" 
                  className="bg-transparent text-sm text-gray-900 outline-none w-full cursor-pointer uppercase" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-1">End Date</label>
              <div className="flex items-center bg-white border-2 border-gray-100 rounded-xl px-4 py-3 gap-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Calendar size={16} className="text-gray-400" />
                <input 
                  type="date" 
                  className="bg-transparent text-sm text-gray-900 outline-none w-full cursor-pointer uppercase" 
                />
              </div>
            </div>
          </div>

          {/* Row 3: Reason */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider ml-1">Reason for leave</label>
            <div className="flex items-start bg-white border-2 border-gray-100 rounded-xl px-4 py-3 gap-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <FileText size={16} className="text-gray-400 mt-1" />
              <textarea rows="4" placeholder="Enter reason here..." className="bg-transparent text-sm text-gray-900 outline-none w-full resize-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
            <button onClick={onSubmit} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95">Submit Request</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestForm;