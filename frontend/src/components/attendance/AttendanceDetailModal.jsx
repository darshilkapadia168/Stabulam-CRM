import React, { useState, useEffect } from 'react';
import { 
  X, Clock, MapPin, User, Calendar, AlertCircle, 
  CheckCircle, Coffee, TrendingUp, AlertTriangle, 
  Image as ImageIcon, DollarSign, Briefcase, LogOut,
  Timer, FileText, XCircle, Building2, Mail
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AttendanceDetailModal = ({ onClose, log }) => {
 
  const [imagePreview, setImagePreview] = useState(null);
  const [imageType, setImageType] = useState('');

  useEffect(() => {
    if (log) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [log]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLocation = (location) => {
    if (!location) return 'Not recorded';
    if (location.officeTag) return location.officeTag;
    if (location.lat && location.long) {
      return `${location.lat.toFixed(6)}, ${location.long.toFixed(6)}`;
    }
    return 'Location unavailable';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'CHECKED_IN': { bg: 'bg-green-100', text: 'text-green-800', label: 'Checked In' },
      'ON_BREAK': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'On Break' },
      'CHECKED_OUT': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Checked Out' },
      'ON_LEAVE': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'On Leave' },
      'PRESENT': { bg: 'bg-green-100', text: 'text-green-800', label: 'Present' },
      'HALF_DAY': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Half Day' },
      'ABSENT': { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent' },
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // ✅ FIXED: Proper image URL construction
 const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  
  // Remove /api from base URL
  const base = API_BASE_URL.replace(/\/api\/?$/, "");
  
  // Remove /api from the image path if it exists
  const cleanPath = imagePath.replace(/^\/api/, '');
  
  const fullUrl = cleanPath.startsWith('/') 
    ? `${base}${cleanPath}` 
    : `${base}/${cleanPath}`;
  
  console.log('🔗 Constructed image URL:', fullUrl);
  return fullUrl;
};

  // ✅ FIXED: Map backend response to modal structure (handles BOTH getDailyLogs and getAttendanceDetailView responses)
  const safeLog = {
    ...log,
    
    // ✅ Employee info - handles both formats
    employee: {
      name: log?.employee?.name || log?.employeeInfo?.name || log?.employeeName || 'N/A',
      department: log?.employee?.department || log?.employeeInfo?.department || log?.department || 'N/A',
      email: log?.employee?.email || log?.employeeInfo?.email || log?.email || 'N/A',
      profileImage: getFullImageUrl(log?.employee?.profileImage || log?.employeeInfo?.profileImage),
    },

    // ✅ Clock In - handles both formats
    clockIn: log?.clockIn ? {
      time: log.clockIn.time,
      location: log.clockIn.location,
      image: getFullImageUrl(log.clockIn.image),
      isLate: log.clockIn.isLate || false,
      lateBy: log.clockIn.lateBy || 0,
      expectedTime: log.clockIn.expectedTime || log.clockIn.expectedClockInTime || null,
    } : null,

    // ✅ Clock Out - handles both formats
    clockOut: log?.clockOut ? {
      time: log.clockOut.time,
      location: log.clockOut.location,
      image: getFullImageUrl(log.clockOut.image),
      isEarlyExit: log.clockOut.isEarlyExit || false,
      earlyBy: log.clockOut.earlyBy || 0,
    } : null,

    // ✅ Breaks
    breaks: {
      totalBreaks: log?.breaks?.totalBreaks || 0,
      sessions: log?.breaks?.sessions || [],
      totalDurationHours: log?.breaks?.totalDurationHours || log?.breaks?.totalDuration || 0
    },

    // ✅ Work Summary
    workSummary: {
      netWorkHours: log?.workSummary?.netWorkHours || log?.netWorkHours || 0,
      expectedWorkHours: log?.workSummary?.expectedWorkHours || 8,
      totalBreakTime: log?.workSummary?.totalBreakTime || 0,
      overtime: {
        hours: log?.workSummary?.overtime?.hours || log?.overtimeHours || 0
      }
    },

    // ✅ Deductions
    deductions: {
      total: log?.deductions?.total || 0,
      late: {
        flag: log?.deductions?.late?.flag || false,
        minutes: log?.deductions?.late?.minutes || 0,
        amount: log?.deductions?.late?.amount || 0
      },
      earlyExit: {
        flag: log?.deductions?.earlyExit?.flag || false,
        minutes: log?.deductions?.earlyExit?.minutes || 0,
        amount: log?.deductions?.earlyExit?.amount || 0
      },
      absent: {
        amount: log?.deductions?.absent?.amount || 0,
        status: log?.deductions?.absent?.status || ''
      },
      breakdown: log?.deductions?.breakdown || []
    },

    // ✅ Additional Info
    additionalInfo: {
      shiftStartTime: log?.additionalInfo?.shiftStartTime || log?.shiftStartTime || 'N/A',
      shiftEndTime: log?.additionalInfo?.shiftEndTime || log?.shiftEndTime || 'N/A',
      createdAt: log?.additionalInfo?.createdAt || log?.createdAt || new Date(),
      updatedAt: log?.additionalInfo?.updatedAt || log?.updatedAt || new Date()
    }
  };

  console.log("🔍 Modal received log:", log);
  console.log("🔍 API Base URL:", API_BASE_URL);
  console.log("🔍 Employee Info:", safeLog.employee);
  console.log("🔍 Clock In image:", safeLog.clockIn?.image);
  console.log("🔍 Clock Out image:", safeLog.clockOut?.image);

  if (!log) return null;

  const handleImageClick = (imageUrl, type) => {
     console.log('🖼️ Opening image preview:', imageUrl)
    setImagePreview(imageUrl);
    setImageType(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      
      {/* Center Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-4xl h-full">
          <div className="h-full flex flex-col bg-white shadow-xl">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-bold">Attendance Details</h2>
                    <p className="text-sm text-indigo-100">{formatDate(log.date)}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
              <div className="p-6 space-y-6">
                
                {/* ✅ FIXED: Employee Information Section */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Employee Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-semibold text-gray-800">{safeLog.employee.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <Building2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm font-semibold text-gray-800">{safeLog.employee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <Mail className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{safeLog.employee.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Current Status</p>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Attendance Status</p>
                    {getStatusBadge(log.attendanceStatus || log.status)}
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Date</p>
                    <p className="text-base font-semibold text-gray-800">
                      {new Date(log.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Clock In Details */}
                {safeLog.clockIn && (
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Clock In Details</h3>
                      {safeLog.clockIn.isLate && (
                        <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Late by {safeLog.clockIn.lateBy} min
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Clock In Time</p>
                        <p className="text-lg font-bold text-green-700">{formatTime(safeLog.clockIn.time)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Expected Time</p>
                        <p className="text-base font-semibold text-gray-700">{safeLog.clockIn.expectedTime || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Location</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <p className="text-base font-semibold text-gray-800">{formatLocation(safeLog.clockIn.location)}</p>
                        </div>
                      </div>
                      {safeLog.clockIn.image ? (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-2">Clock In Photo</p>
                          <div 
                            className="relative group w-32 h-32 rounded-lg overflow-hidden border-2 border-green-300 cursor-pointer"
                            onClick={() => handleImageClick(safeLog.clockIn.image, 'Clock In')}
                          >
                            <img 
                              src={safeLog.clockIn.image} 
                              alt="Clock In" 
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover will-change-transform"
                            />

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                              <ImageIcon className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-2">Clock In Photo</p>
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">No photo</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clock Out Details */}
                {safeLog.clockOut && (
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <LogOut className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Clock Out Details</h3>
                      {safeLog.clockOut.isEarlyExit && (
                        <span className="ml-auto px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Early by {safeLog.clockOut.earlyBy} min
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Clock Out Time</p>
                        <p className="text-lg font-bold text-blue-700">{formatTime(safeLog.clockOut.time)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Location</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <p className="text-base font-semibold text-gray-800">{formatLocation(safeLog.clockOut.location)}</p>
                        </div>
                      </div>
                      {safeLog.clockOut.image ? (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-2">Clock Out Photo</p>
                          <div 
                            className="relative group w-32 h-32 rounded-lg overflow-hidden border-2 border-green-300 cursor-pointer"
                            onClick={() => handleImageClick(safeLog.clockOut.image, 'Clock Out')}
                          >
                            <img 
                              src={safeLog.clockOut.image} 
                              alt="Clock Out" 
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover will-change-transform"
                            />

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                              <ImageIcon className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-2">Clock Out Photo</p>
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">No photo</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Break Sessions */}
                {safeLog.breaks && safeLog.breaks.totalBreaks > 0 && (
                  <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Coffee className="w-5 h-5 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Break Sessions</h3>
                      <span className="ml-auto px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                        {safeLog.breaks.totalBreaks} breaks • {safeLog.breaks.totalDurationHours}h total
                      </span>
                    </div>
                    <div className="space-y-3">
                      {safeLog.breaks.sessions && safeLog.breaks.sessions.map((breakSession, idx) => (
                        <div key={breakSession.breakNumber || idx} className="bg-white p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">Break #{breakSession.breakNumber || (idx + 1)}</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              breakSession.status === 'Completed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {breakSession.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Start</p>
                              <p className="font-semibold text-gray-800">{formatTime(breakSession.startTime)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">End</p>
                              <p className="font-semibold text-gray-800">{formatTime(breakSession.endTime)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Duration</p>
                              <p className="font-semibold text-orange-600">{breakSession.duration} min</p>
                            </div>
                          </div>
                          {breakSession.reason && (
                            <div className="mt-2 pt-2 border-t border-orange-100">
                              <p className="text-xs text-gray-600">Reason: {breakSession.reason}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Summary */}
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Timer className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Work Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-indigo-100">
                      <p className="text-xs text-gray-600 mb-1">Net Work Hours</p>
                      <p className="text-2xl font-bold text-indigo-600">{safeLog.workSummary?.netWorkHours || 0}h</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-indigo-100">
                      <p className="text-xs text-gray-600 mb-1">Expected Hours</p>
                      <p className="text-2xl font-bold text-gray-700">{safeLog.workSummary?.expectedWorkHours || 0}h</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-indigo-100">
                      <p className="text-xs text-gray-600 mb-1">Break Time</p>
                      <p className="text-2xl font-bold text-orange-600">{((safeLog.workSummary?.totalBreakTime || 0) / 60).toFixed(2)}h</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-indigo-100">
                      <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-500" />
                        Overtime
                      </p>
                      <p className="text-2xl font-bold text-green-600">{safeLog.workSummary?.overtime?.hours || 0}h</p>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                {(safeLog.deductions.total > 0 || safeLog.deductions.late.flag || safeLog.deductions.earlyExit.flag) && (
                  <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Deductions & Penalties</h3>
                      <span className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-full text-lg font-bold">
                        ₹{safeLog.deductions.total}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {safeLog.deductions.late.flag && (
                        <div className="bg-white p-4 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <p className="text-xs text-gray-600 font-semibold">Late Arrival</p>
                          </div>
                          <p className="text-sm text-gray-600">{safeLog.deductions.late.minutes} minutes</p>
                          <p className="text-xl font-bold text-red-600">₹{safeLog.deductions.late.amount}</p>
                        </div>
                      )}
                      
                      {safeLog.deductions.earlyExit.flag && (
                        <div className="bg-white p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <LogOut className="w-4 h-4 text-orange-500" />
                            <p className="text-xs text-gray-600 font-semibold">Early Exit</p>
                          </div>
                          <p className="text-sm text-gray-600">{safeLog.deductions.earlyExit.minutes} minutes</p>
                          <p className="text-xl font-bold text-orange-600">₹{safeLog.deductions.earlyExit.amount}</p>
                        </div>
                      )}

                      {safeLog.deductions.absent && safeLog.deductions.absent.amount > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4 text-gray-500" />
                            <p className="text-xs text-gray-600 font-semibold">Absent</p>
                          </div>
                          <p className="text-sm text-gray-600">{safeLog.deductions.absent.status}</p>
                          <p className="text-xl font-bold text-gray-600">₹{safeLog.deductions.absent.amount}</p>
                        </div>
                      )}
                    </div>

                    {/* Deduction Breakdown */}
                    {safeLog.deductions.breakdown && safeLog.deductions.breakdown.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-red-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Deduction Breakdown:</p>
                        <div className="space-y-2">
                          {safeLog.deductions.breakdown.map((item, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-red-100 flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{item.type}</p>
                                <p className="text-xs text-gray-600">{item.description}</p>
                              </div>
                              <p className="text-sm font-bold text-red-600">₹{item.amount}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Additional Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Shift Start Time</p>
                      <p className="font-semibold text-gray-800">{safeLog.additionalInfo.shiftStartTime}</p>
                    </div>
                    {safeLog.additionalInfo.shiftEndTime && safeLog.additionalInfo.shiftEndTime !== 'N/A' && (
                      <div>
                        <p className="text-gray-600 mb-1">Shift End Time</p>
                        <p className="font-semibold text-gray-800">{safeLog.additionalInfo.shiftEndTime}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 mb-1">Record Created</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(safeLog.additionalInfo.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Last Updated</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(safeLog.additionalInfo.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div 
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-12 right-0 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
            <div className="bg-white p-2 rounded-t-lg -mb-2">
              <p className="text-sm font-semibold text-gray-700 text-center">{imageType} Photo</p>
            </div>
            <img
              src={imagePreview}
              alt={imageType}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onError={(e) => {
                console.error("❌ Preview image failed:", imagePreview);
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDetailModal;