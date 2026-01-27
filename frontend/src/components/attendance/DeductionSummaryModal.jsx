// components/DeductionSummaryModal.jsx - OPTIMIZED FOR PERFORMANCE

import { 
  X, 
  FileText, 
  Download, 
  TrendingDown, 
  TrendingUp,
  Clock,
  Coffee,
  LogOut,
  AlertTriangle,
  Award,
  IndianRupee,
  Users,
  Calendar
} from "lucide-react";

const DeductionSummaryModal = ({ 
  isOpen, 
  onClose, 
  deductionSummary, 
  viewMode,
  selectedDate,
  payrollSettings 
}) => {
  if (!isOpen || !deductionSummary) return null;

  const { summary, deductionReports } = deductionSummary;

  // Calculate net impact (bonuses - penalties)
  const totalBonuses = summary.totalOvertimeBonuses || 0;
  const netImpact = totalBonuses - summary.grandTotalDeductions;

  // Export to CSV function
  const handleExport = () => {
    const headers = viewMode === 'all' 
      ? ["Employee Name", "Employee Code", "Date", "Late (₹)", "Late (min)", "Early Exit (₹)", "Early Exit (min)", "Break (₹)", "Break (min)", "Absent (₹)", "OT Bonus (₹)", "OT (min)", "Total Deduction", "Total Bonus", "Net Amount", "Work Hours"]
      : ["Employee Name", "Employee Code", "Late (₹)", "Late (min)", "Early Exit (₹)", "Early Exit (min)", "Break (₹)", "Break (min)", "Absent (₹)", "OT Bonus (₹)", "OT (min)", "Total Deduction", "Total Bonus", "Net Amount", "Work Hours"];

    const rows = deductionReports.map(report => {
      const netAmount = (report.overtimeBonus || 0) - report.totalDeduction;
      const baseRow = [
        report.employeeInfo.name,
        report.employeeInfo.employeeCode,
      ];
      
      if (viewMode === 'all') {
        baseRow.push(new Date(report.date).toLocaleDateString('en-US'));
      }
      
      baseRow.push(
        report.lateDeduction || 0,
        report.lateMinutes || 0,
        report.earlyExitDeduction || 0,
        report.earlyExitMinutes || 0,
        report.breakPenalty || 0,
        report.excessBreakMinutes || 0,
        report.absentDeduction || 0,
        report.overtimeBonus || 0,
        report.overtimeMinutes || 0,
        report.totalDeduction,
        report.overtimeBonus || 0,
        netAmount,
        report.netWorkHours
      );
      
      return baseRow;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deduction-summary-${viewMode === 'all' ? 'all' : selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Simplified */}
        <div className="bg-indigo-600 text-white p-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Payroll Summary Report</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {viewMode === 'all' ? "Last 40 Days Overview" : `Date: ${selectedDate}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards Grid - Simplified */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {/* Total Deductions */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} className="text-red-600" />
                <p className="text-xs text-red-700 font-semibold uppercase">Deductions</p>
              </div>
              <p className="text-2xl font-bold text-red-700">₹{summary.grandTotalDeductions}</p>
              <p className="text-xs text-red-600 mt-1">{summary.totalRecords} records</p>
            </div>

            {/* Total Bonuses */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-600" />
                <p className="text-xs text-green-700 font-semibold uppercase">Bonuses</p>
              </div>
              <p className="text-2xl font-bold text-green-700">₹{totalBonuses}</p>
              <p className="text-xs text-green-600 mt-1">{summary.overtimeCount || 0} employees</p>
            </div>

            {/* Net Impact */}
            <div className={`${netImpact >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee size={16} className={netImpact >= 0 ? 'text-blue-600' : 'text-orange-600'} />
                <p className={`text-xs font-semibold uppercase ${netImpact >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Impact</p>
              </div>
              <p className={`text-2xl font-bold ${netImpact >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {netImpact >= 0 ? '+' : ''}₹{netImpact}
              </p>
              <p className={`text-xs mt-1 ${netImpact >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {netImpact >= 0 ? 'Net gain' : 'Net loss'}
              </p>
            </div>

            {/* Late Penalties */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-orange-600" />
                <p className="text-xs text-orange-700 font-semibold uppercase">Late</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">₹{summary.totalLateDeductions}</p>
              <p className="text-xs text-orange-600 mt-1">{summary.lateCount} cases</p>
            </div>

            {/* Early Exit */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <LogOut size={16} className="text-yellow-600" />
                <p className="text-xs text-yellow-700 font-semibold uppercase">Early Exit</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700">₹{summary.totalEarlyExitDeductions}</p>
              <p className="text-xs text-yellow-600 mt-1">{summary.earlyExitCount} cases</p>
            </div>

            {/* Absent */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-gray-600" />
                <p className="text-xs text-gray-700 font-semibold uppercase">Absent</p>
              </div>
              <p className="text-2xl font-bold text-gray-700">₹{summary.totalAbsentDeductions}</p>
              <p className="text-xs text-gray-600 mt-1">{summary.absentCount} cases</p>
            </div>
          </div>

          {/* Additional Stats Row */}
          {summary.totalBreakPenalties > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee size={16} className="text-blue-600" />
                  <p className="text-xs text-blue-700 font-semibold uppercase">Break Penalties</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">₹{summary.totalBreakPenalties || 0}</p>
                <p className="text-xs text-blue-600 mt-1">{summary.breakPenaltyCount || 0} cases</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-purple-600" />
                  <p className="text-xs text-purple-700 font-semibold uppercase">Total Employees</p>
                </div>
                <p className="text-2xl font-bold text-purple-700">{summary.uniqueEmployees || summary.totalRecords}</p>
                <p className="text-xs text-purple-600 mt-1">tracked</p>
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} className="text-pink-600" />
                  <p className="text-xs text-pink-700 font-semibold uppercase">Avg Per Record</p>
                </div>
                <p className="text-2xl font-bold text-pink-700">
                  ₹{Math.round((summary.grandTotalDeductions - totalBonuses) / summary.totalRecords)}
                </p>
                <p className="text-xs text-pink-600 mt-1">net impact</p>
              </div>
            </div>
          )}

          {/* Detailed Report Table - Simplified */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} />
                Detailed Breakdown
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Employee</th>
                    {viewMode === 'all' && (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    )}
                    <th className="px-3 py-2 text-center text-xs font-semibold text-red-700 uppercase">Late</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-orange-700 uppercase">Early Exit</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-blue-700 uppercase">Break</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Absent</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-green-700 uppercase">OT Bonus</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-indigo-700 uppercase">Net</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Work Hrs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deductionReports.map((report, index) => {
                    const reportNetAmount = (report.overtimeBonus || 0) - report.totalDeduction;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                              {report.employeeInfo.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{report.employeeInfo.name}</p>
                              <p className="text-xs text-gray-500">{report.employeeInfo.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        {viewMode === 'all' && (
                          <td className="px-3 py-2">
                            <p className="text-sm text-gray-700">
                              {new Date(report.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </td>
                        )}
                        <td className="px-3 py-2 text-center">
                          {report.lateDeduction > 0 ? (
                            <div className="inline-block">
                              <p className="text-sm font-semibold text-red-700">-₹{report.lateDeduction}</p>
                              <p className="text-xs text-red-600">{report.lateMinutes}m</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {report.earlyExitDeduction > 0 ? (
                            <div className="inline-block">
                              <p className="text-sm font-semibold text-orange-700">-₹{report.earlyExitDeduction}</p>
                              <p className="text-xs text-orange-600">{report.earlyExitMinutes}m</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {report.breakPenalty > 0 ? (
                            <div className="inline-block">
                              <p className="text-sm font-semibold text-blue-700">-₹{report.breakPenalty}</p>
                              <p className="text-xs text-blue-600">{report.excessBreakMinutes}m</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {report.absentDeduction > 0 ? (
                            <div className="inline-block">
                              <p className="text-sm font-semibold text-gray-700">-₹{report.absentDeduction}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {report.overtimeBonus > 0 ? (
                            <div className="inline-block">
                              <p className="text-sm font-semibold text-green-700">+₹{report.overtimeBonus}</p>
                              <p className="text-xs text-green-600">{report.overtimeMinutes}m</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 font-semibold text-sm ${
                            reportNetAmount >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {reportNetAmount >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {reportNetAmount >= 0 ? '+' : ''}₹{reportNetAmount}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-sm text-gray-700 font-semibold">{report.netWorkHours}h</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {deductionReports.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">No records found for this period</p>
              </div>
            )}
          </div>

          {/* Current Settings Reference - Simplified */}
          {payrollSettings && (
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <IndianRupee size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center justify-between">
                    Applied Payroll Policy
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-semibold">
                      ACTIVE
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Late Grace</p>
                      <p className="text-base font-bold text-gray-900">{payrollSettings.lateGracePeriodMinutes}min</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Max Late Penalty</p>
                      <p className="text-base font-bold text-red-600">₹{payrollSettings.latePenalties?.after1AndHalfHours}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Max OT Bonus</p>
                      <p className="text-base font-bold text-green-600">₹{payrollSettings.overtimeBonuses?.after4Hours}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600 mb-1">Shift Duration</p>
                      <p className="text-base font-bold text-gray-900">{payrollSettings.standardShiftMinutes / 60}h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
          >
            <Download size={18} />
            Export to CSV
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeductionSummaryModal;