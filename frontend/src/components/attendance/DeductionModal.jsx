// components/DeductionModal.jsx - UPDATED FOR TIERED SYSTEM

import {
  X,
  DollarSign,
  Clock,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  TrendingDown,
  TrendingUp,
  Settings,
  Award,
  Coffee,
  Zap
} from "lucide-react";

const DeductionModal = ({ 
  isOpen, 
  onClose, 
  log, 
  payrollSettings 
}) => {
  if (!isOpen || !log) return null;

  const breakdown = log.deductionBreakdown || [];
  const bonuses = log.bonusBreakdown || [];
  
  const totalPenalties = breakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalBonuses = bonuses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netAmount = totalBonuses - totalPenalties;

  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getLatePenaltyTier = (minutes) => {
    if (!payrollSettings) return "Unknown";
    if (minutes <= payrollSettings.lateGracePeriodMinutes) return "Grace Period";
    if (minutes <= 60) return "Tier 1 (30-60 min)";
    if (minutes <= 90) return "Tier 2 (60-90 min)";
    return "Tier 3 (90+ min)";
  };

  const getOvertimeBonusTier = (minutes) => {
    if (!payrollSettings) return "Unknown";
    const hours = minutes / 60;
    if (hours >= 4) return "Level 4 (4+ hours)";
    if (hours >= 3) return "Level 3 (3 hours)";
    if (hours >= 2) return "Level 2 (2 hours)";
    if (hours >= 1) return "Level 1 (1 hour)";
    return "Below minimum";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-2xl z-10 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                <DollarSign size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Payroll Breakdown</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {log.employeeInfo?.name || "Your Record"} • {new Date(log.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Net Amount Card */}
          <div className={`bg-gradient-to-br ${
            netAmount >= 0 
              ? 'from-green-50 to-emerald-100 border-green-300' 
              : 'from-red-50 to-pink-100 border-red-300'
          } border-2 rounded-2xl p-6 mb-6 shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold mb-1 text-gray-700">Net Impact on Payroll</p>
                <p className={`text-5xl font-bold ${
                  netAmount >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {netAmount >= 0 ? '+' : ''}₹{netAmount}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {netAmount >= 0 
                    ? '🎉 Bonus earned!' 
                    : '⚠️ Penalty applied'}
                </p>
              </div>
              <div className={`p-4 rounded-full ${
                netAmount >= 0 ? 'bg-green-200' : 'bg-red-200'
              }`}>
                {netAmount >= 0 ? (
                  <TrendingUp size={40} className={netAmount >= 0 ? 'text-green-700' : 'text-red-700'} />
                ) : (
                  <TrendingDown size={40} className="text-red-700" />
                )}
              </div>
            </div>
            
            {/* Breakdown Summary */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-white/50">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-semibold mb-1">Total Bonuses</p>
                <p className="text-2xl font-bold text-green-600">+₹{totalBonuses}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-semibold mb-1">Total Penalties</p>
                <p className="text-2xl font-bold text-red-600">-₹{totalPenalties}</p>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-blue-600" />
                <p className="text-xs text-blue-900 font-bold uppercase">Clock In</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(log.clockInTime)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Expected: {log.shiftStartTime || "09:00"}
              </p>
              {log.lateMinutes > 0 && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  ⏰ {log.lateMinutes} min late
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <LogOut size={18} className="text-purple-600" />
                <p className="text-xs text-purple-900 font-bold uppercase">Clock Out</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(log.clockOutTime)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Work: {log.netWorkHours || 0}h
              </p>
              {log.overtimeMinutes > 0 && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  🎯 {log.overtimeMinutes} min OT
                </p>
              )}
            </div>
          </div>

          {/* BONUSES Section */}
          {bonuses.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={22} className="text-green-500" />
                Bonuses Earned
              </h3>
              
              <div className="space-y-3">
                {bonuses.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 shadow-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Award size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-green-900 text-lg">
                            {item.type?.replace(/_/g, ' ') || 'Bonus'}
                          </p>
                          {item.minutes && (
                            <p className="text-sm text-green-700 font-medium">
                              {getOvertimeBonusTier(item.minutes)}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        +₹{item.amount}
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2 bg-white/50 p-2 rounded">
                      {item.description}
                    </p>
                    
                    {item.minutes && (
                      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-2 rounded-lg font-semibold">
                        <Timer size={14} />
                        <span>{item.minutes} minutes ({(item.minutes / 60).toFixed(2)} hours)</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PENALTIES Section */}
          {breakdown.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={22} className="text-red-500" />
                Penalties Applied
              </h3>

              <div className="space-y-3">
                {breakdown.map((item, index) => (
                  <div
                    key={index}
                    className={`border-l-4 rounded-lg p-4 shadow-md ${
                      item.type === 'LATE'
                        ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-500'
                        : item.type === 'EARLY_EXIT'
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-500'
                        : item.type === 'EXCESS_BREAK'
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500'
                        : item.type === 'HALF_DAY_ABSENT'
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-500'
                        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'LATE' ? 'bg-red-100' :
                          item.type === 'EARLY_EXIT' ? 'bg-orange-100' :
                          item.type === 'EXCESS_BREAK' ? 'bg-blue-100' :
                          item.type === 'HALF_DAY_ABSENT' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          {item.type === 'LATE' && <AlertTriangle size={20} className="text-red-600" />}
                          {item.type === 'EARLY_EXIT' && <LogOut size={20} className="text-orange-600" />}
                          {item.type === 'EXCESS_BREAK' && <Coffee size={20} className="text-blue-600" />}
                          {item.type === 'HALF_DAY_ABSENT' && <Timer size={20} className="text-yellow-600" />}
                          {item.type === 'ABSENT' && <XCircle size={20} className="text-gray-600" />}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${
                            item.type === 'LATE' ? 'text-red-900' :
                            item.type === 'EARLY_EXIT' ? 'text-orange-900' :
                            item.type === 'EXCESS_BREAK' ? 'text-blue-900' :
                            item.type === 'HALF_DAY_ABSENT' ? 'text-yellow-900' : 'text-gray-900'
                          }`}>
                            {item.type?.replace(/_/g, ' ')}
                          </p>
                          {item.type === 'LATE' && item.minutes && (
                            <p className="text-sm text-red-700 font-medium">
                              {getLatePenaltyTier(item.minutes)}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className={`text-2xl font-bold ${
                        item.type === 'LATE' ? 'text-red-700' :
                        item.type === 'EARLY_EXIT' ? 'text-orange-700' :
                        item.type === 'EXCESS_BREAK' ? 'text-blue-700' :
                        item.type === 'HALF_DAY_ABSENT' ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                        -₹{item.amount}
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2 bg-white/50 p-2 rounded">
                      {item.description}
                    </p>
                    
                    {item.minutes && (
                      <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-semibold ${
                        item.type === 'LATE' ? 'text-red-700 bg-red-100' :
                        item.type === 'EARLY_EXIT' ? 'text-orange-700 bg-orange-100' :
                        item.type === 'EXCESS_BREAK' ? 'text-blue-700 bg-blue-100' :
                        'text-yellow-700 bg-yellow-100'
                      }`}>
                        <Timer size={14} />
                        <span>Duration: {item.minutes} minutes</span>
                      </div>
                    )}
                    
                    {item.workMinutes !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-gray-700 bg-white/70 px-3 py-2 rounded-lg mt-2 font-medium">
                        <Clock size={14} />
                        <span>Actual work: {(item.workMinutes / 60).toFixed(2)} hours</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Deductions/Bonuses */}
          {breakdown.length === 0 && bonuses.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
              <p className="text-green-800 font-bold text-xl mb-2">Perfect Attendance!</p>
              <p className="text-sm text-green-600">No penalties or bonuses for this day</p>
            </div>
          )}

          {/* Current Payroll Settings */}
          {payrollSettings && (
            <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Settings size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-gray-900 text-lg">Current Payroll Policy</p>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                      ACTIVE
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Late Penalties */}
                    <div className="bg-white/70 p-3 rounded-lg border border-red-200">
                      <p className="font-bold text-red-800 mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Late Arrival (Tiered)
                      </p>
                      <div className="space-y-1 text-gray-700">
                        <p>Grace: {payrollSettings.lateGracePeriodMinutes}min</p>
                        <p>Tier 1 (30-60min): ₹{payrollSettings.latePenalties?.after30Minutes}</p>
                        <p>Tier 2 (60-90min): ₹{payrollSettings.latePenalties?.after1Hour}</p>
                        <p>Tier 3 (90+min): ₹{payrollSettings.latePenalties?.after1AndHalfHours}</p>
                      </div>
                    </div>

                    {/* Overtime Bonuses */}
                    <div className="bg-white/70 p-3 rounded-lg border border-green-200">
                      <p className="font-bold text-green-800 mb-2 flex items-center gap-1">
                        <Award size={14} />
                        Overtime Bonus (Tiered)
                      </p>
                      <div className="space-y-1 text-gray-700">
                        <p>1 hour: ₹{payrollSettings.overtimeBonuses?.after1Hour}</p>
                        <p>2 hours: ₹{payrollSettings.overtimeBonuses?.after2Hours}</p>
                        <p>3 hours: ₹{payrollSettings.overtimeBonuses?.after3Hours}</p>
                        <p>4+ hours: ₹{payrollSettings.overtimeBonuses?.after4Hours}</p>
                      </div>
                    </div>

                    {/* Early Exit */}
                    <div className="bg-white/70 p-3 rounded-lg border border-orange-200">
                      <p className="font-bold text-orange-800 mb-2 flex items-center gap-1">
                        <LogOut size={14} />
                        Early Exit
                      </p>
                      <p className="text-gray-700">
                        ₹{payrollSettings.earlyExitPenaltyPerMinute}/min
                        <br />
                        (Grace: {payrollSettings.earlyExitGraceMinutes}min)
                      </p>
                    </div>

                    {/* Absence */}
                    <div className="bg-white/70 p-3 rounded-lg border border-yellow-200">
                      <p className="font-bold text-yellow-800 mb-2 flex items-center gap-1">
                        <XCircle size={14} />
                        Absence
                      </p>
                      <div className="text-gray-700">
                        <p>Half Day: ₹{payrollSettings.halfDayPenalty}</p>
                        <p>Full Day: ₹{payrollSettings.absentFullDayPenalty}</p>
                        <p className="text-xs mt-1">(Threshold: {payrollSettings.halfDayThresholdMinutes}min)</p>
                      </div>
                    </div>

                    {/* Break */}
                    <div className="bg-white/70 p-3 rounded-lg border border-blue-200">
                      <p className="font-bold text-blue-800 mb-2 flex items-center gap-1">
                        <Coffee size={14} />
                        Break Time
                      </p>
                      <p className="text-gray-700">
                        Max: {payrollSettings.maxBreakMinutes}min
                        <br />
                        Excess: ₹{payrollSettings.excessBreakPenaltyPerMinute}/min
                      </p>
                    </div>

                    {/* Shift */}
                    <div className="bg-white/70 p-3 rounded-lg border border-purple-200">
                      <p className="font-bold text-purple-800 mb-2 flex items-center gap-1">
                        <Clock size={14} />
                        Standard Shift
                      </p>
                      <p className="text-gray-700">
                        {payrollSettings.standardShiftMinutes / 60} hours/day
                        <br />
                        ({payrollSettings.standardShiftMinutes} minutes)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t-2 border-gray-200 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-bold transition-all shadow-md hover:shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeductionModal;