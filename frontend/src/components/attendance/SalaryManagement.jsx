import React from "react";
import { 
  UserCheck, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const SalaryManagement = ({ userRole }) => {
  // Summary Stats based on your provided requirements
  const summaryStats = [
    { title: "Days Present", value: "07", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", label: "This Month" },
    { title: "Total Hours", value: "56h", icon: Clock, color: "text-rose-500", bg: "bg-rose-50", label: "Working hours" },
    { title: "Late Marks", value: "00h", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", label: "This Month" },
    { title: "Overtime", value: "01h", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", label: "Extra hours" },
  ];

  // Helper to generate calendar days (simplified for UI)
  const calendarDays = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    status: i === 6 || i === 13 || i === 20 || i === 27 ? "absent" : 
            i === 23 ? "overtime" : 
            i === 15 ? "leave" : "present"
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                <stat.icon size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">{stat.title}</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 2. Main Content: Calendar & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Calendar */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-800">Attendance Calendar</h3>
              <p className="text-[10px] text-gray-400">Select a date to view details</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><ChevronLeft size={18}/></button>
              <span className="text-xs font-bold text-gray-700">February 2022</span>
              <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><ChevronRight size={18}/></button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-6">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <span key={d} className="text-[10px] font-bold text-gray-300 py-2">{d}</span>
            ))}
            {calendarDays.map((d) => (
              <div 
                key={d.day} 
                className={`
                  aspect-square flex items-center justify-center text-[11px] font-bold rounded-lg cursor-pointer transition-all
                  ${d.status === 'present' ? 'text-gray-600 hover:bg-emerald-50' : ''}
                  ${d.status === 'absent' ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : ''}
                  ${d.status === 'overtime' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : ''}
                  ${d.status === 'leave' ? 'bg-yellow-400 text-white' : ''}
                  ${d.day === 24 ? 'border-2 border-blue-600' : ''}
                `}
              >
                {d.day}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-50">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/> <span className="text-[10px] text-gray-400 font-bold">Present</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"/> <span className="text-[10px] text-gray-400 font-bold">Absent</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-400"/> <span className="text-[10px] text-gray-400 font-bold">Leave</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"/> <span className="text-[10px] text-gray-400 font-bold">Overtime</span></div>
          </div>
        </div>

        {/* Recent Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Recent Attendance</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95">
              <Download size={14} /> Download
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Login</th>
                  <th className="px-6 py-4">Logout</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { date: "15/02/2022", login: "9:55", logout: "6:55", hours: "8", status: "On-time", color: "text-emerald-500" },
                  { date: "14/02/2022", login: "10:15", logout: "6:55", hours: "7", status: "Late", color: "text-rose-500" },
                  { date: "13/02/2022", login: "10:30", logout: "6:55", hours: "7", status: "Late", color: "text-rose-500" },
                  { date: "12/02/2022", login: "9:55", logout: "6:55", hours: "8", status: "On-time", color: "text-emerald-500" },
                ].map((row, i) => (
                  <tr key={i} className="text-gray-600">
                    <td className="px-6 py-4 text-xs font-medium">{row.date}</td>
                    <td className="px-6 py-4 text-xs">{row.login}</td>
                    <td className="px-6 py-4 text-xs">{row.logout}</td>
                    <td className="px-6 py-4 text-xs">{row.hours}</td>
                    <td className={`px-6 py-4 text-[10px] font-black uppercase ${row.color}`}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryManagement;
  