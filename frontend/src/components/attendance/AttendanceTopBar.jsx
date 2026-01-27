import { useState, useEffect } from "react";
import { Zap, Clock, ArrowRightLeft, LogOut, Coffee, Timer } from "lucide-react";
import WorkHoursCounter from "./WorkHoursCounter";
import StatusIndicator from "./StatusIndicator";
import CameraCapture from "./CameraCapture";
import axios from "axios";
import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api`;

const AttendanceTopBar = () => {
  const [status, setStatus] = useState(null);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [totalBreakDuration, setTotalBreakDuration] = useState(0);
  const [currentBreakDuration, setCurrentBreakDuration] = useState(0);
  const [breakSummary, setBreakSummary] = useState({ totalBreaks: 0, totalBreakHours: 0 }); // ✅ NEW
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAction, setCameraAction] = useState(null);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // ==========================
  // Fetch live status from backend
  // ==========================
  const fetchLiveStatus = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/attendance/live-status`, axiosConfig);
      const {
        status: backendStatus,
        clockInTime: backendClockInTime,
        clockOutTime: backendClockOutTime,
        totalBreakDuration: backendTotalBreak,
        currentBreakDuration: backendCurrentBreak,
        breakSummary: backendBreakSummary, // ✅ NEW
      } = res.data;

      console.log("✅ Fetched live status:", res.data);

      setStatus(backendStatus);
      setClockInTime(backendClockInTime ? new Date(backendClockInTime) : null);
      setClockOutTime(backendClockOutTime ? new Date(backendClockOutTime) : null);
      setTotalBreakDuration(backendTotalBreak || 0);
      setCurrentBreakDuration(backendCurrentBreak || 0);
      setBreakSummary(backendBreakSummary || { totalBreaks: 0, totalBreakHours: 0 }); // ✅ NEW
    } catch (err) {
      console.error("Failed to fetch live attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Clock In with Photo & Location
  // ==========================
  const handleClockInClick = () => {
    setCameraAction("clockIn");
    setShowCamera(true);
  };

  const handleClockInWithData = async (photoBlob, location) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", photoBlob, "clock-in.jpg");
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);
      formData.append("officeTag", location.officeTag || "Office");

      const res = await axios.post(`${API_BASE}/attendance/clock-in`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const {
        status: backendStatus,
        clockInTime: backendClockInTime,
        clockOutTime: backendClockOutTime,
        totalBreakDuration: backendTotalBreak,
      } = res.data.data;

      setStatus(backendStatus);
      setClockInTime(new Date(backendClockInTime));
      setClockOutTime(backendClockOutTime ? new Date(backendClockOutTime) : null);
      setTotalBreakDuration(backendTotalBreak || 0);
      setCurrentBreakDuration(0);
      setBreakSummary({ totalBreaks: 0, totalBreakHours: 0 }); // ✅ Reset on clock-in

      alert("Clock-in successful!");
    } catch (err) {
      if (err.response?.data?.message === "Already clocked in") {
        fetchLiveStatus();
      } else {
        alert(err.response?.data?.message || "Clock In failed");
        fetchLiveStatus();
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Clock Out with Photo & Location
  // ==========================
  const handleClockOutClick = () => {
    setCameraAction("clockOut");
    setShowCamera(true);
  };

  const handleClockOutWithData = async (photoBlob, location) => {
    setLoading(true);
    try {
      console.log("📍 Location data:", location);
      console.log("📷 Photo blob:", photoBlob);
      console.log("📊 Current status:", status);

      const formData = new FormData();
      formData.append("photo", photoBlob, "clock-out.jpg");
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);
      formData.append("officeTag", location.officeTag || "Office");

      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const res = await axios.post(`${API_BASE}/attendance/clock-out`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const {
        status: backendStatus,
        clockInTime: backendClockInTime,
        clockOutTime: backendClockOutTime,
        totalBreakDuration: backendTotalBreak,
        breakSummary: backendBreakSummary, // ✅ NEW
      } = res.data.data;

      setStatus(backendStatus);
      setClockInTime(backendClockInTime ? new Date(backendClockInTime) : null);
      setClockOutTime(backendClockOutTime ? new Date(backendClockOutTime) : new Date());
      setTotalBreakDuration(backendTotalBreak || 0);
      setCurrentBreakDuration(0);
      setBreakSummary(backendBreakSummary || { totalBreaks: 0, totalBreakHours: 0 }); // ✅ NEW

      alert("Clock-out successful!");
    } catch (err) {
      console.error("❌ Clock-out error:", err);
      console.error("❌ Response data:", err.response?.data);
      console.error("❌ Status code:", err.response?.status);
      
      alert(err.response?.data?.message || "Clock Out failed");
      fetchLiveStatus();
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Handle Camera Capture
  // ==========================
  const handleCameraCapture = (photoBlob, location) => {
    if (cameraAction === "clockIn") {
      handleClockInWithData(photoBlob, location);
    } else if (cameraAction === "clockOut") {
      handleClockOutWithData(photoBlob, location);
    }
  };

  // ==========================
  // Break Start / End
  // ==========================
  const handleBreakToggle = async () => {
    setLoading(true);
    try {
      if (status === "ON_BREAK") {
        const res = await axios.post(`${API_BASE}/attendance/break/end`, {}, axiosConfig);
        const {
          status: backendStatus,
          clockInTime: backendClockInTime,
          clockOutTime: backendClockOutTime,
          totalBreakDuration: backendTotalBreak,
          breakSummary: backendBreakSummary, // ✅ NEW
        } = res.data.data;

        setStatus(backendStatus);
        setClockInTime(backendClockInTime ? new Date(backendClockInTime) : null);
        setClockOutTime(backendClockOutTime ? new Date(backendClockOutTime) : null);
        setTotalBreakDuration(backendTotalBreak || 0);
        setCurrentBreakDuration(0);
        setBreakSummary(backendBreakSummary || { totalBreaks: 0, totalBreakHours: 0 }); // ✅ NEW
      } else {
        const res = await axios.post(`${API_BASE}/attendance/break/start`, {}, axiosConfig);
        const {
          status: backendStatus,
          clockInTime: backendClockInTime,
          clockOutTime: backendClockOutTime,
          totalBreakDuration: backendTotalBreak,
        } = res.data.data;

        setStatus(backendStatus);
        setClockInTime(backendClockInTime ? new Date(backendClockInTime) : null);
        setClockOutTime(backendClockOutTime ? new Date(backendClockOutTime) : null);
        setTotalBreakDuration(backendTotalBreak || 0);
      }
      fetchLiveStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Break action failed");
      fetchLiveStatus();
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Socket.IO real-time updates
  // ==========================
  useEffect(() => {
    fetchLiveStatus();

    const socket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => console.log("⚡ Connected:", socket.id));
    socket.on("attendance:update", () => {
      console.log("📡 Received attendance update");
      fetchLiveStatus();
    });

    return () => socket.disconnect();
  }, []);

  const isButtonDisabled = loading;

  return (
    <>
      <div className="w-full bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6 font-sans">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Zap size={18} className="text-blue-500 fill-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm leading-tight">Quick actions</h3>
            <p className="text-[11px] text-gray-400 uppercase font-medium">Manage your Day efficiently</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Tracking Card */}
          <div className="flex flex-col justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl min-h-[100px]">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-50">
                  <Clock size={20} className="text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-gray-800 text-sm">Time Tracking</h4>
                  <StatusIndicator status={status} />
                </div>
              </div>

              <button
                onClick={
                  status === "CHECKED_IN" || status === "ON_BREAK"
                    ? handleClockOutClick
                    : handleClockInClick
                }
                disabled={isButtonDisabled || status === "ON_LEAVE"}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-2 ${
                  !status || status === "CHECKED_OUT"
                    ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    : "bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                }`}
              >
                {!status || status === "CHECKED_OUT" ? (
                  "Clock In"
                ) : (
                  <>
                    <LogOut size={14} /> Clock Out
                  </>
                )}
              </button>
            </div>

            {/* Break Button with Summary - ✅ ENHANCED */}
            {status && status !== "CHECKED_OUT" && status !== "ON_LEAVE" && (
              <div className="mt-3 pt-3 border-t border-blue-100/50 flex justify-between items-center">
                {/* ✅ Break Summary Display */}
                {breakSummary.totalBreaks > 0 && (
                  <div className="text-[11px] text-gray-500">
                    <span className="font-medium">{breakSummary.totalBreaks}</span> break{breakSummary.totalBreaks > 1 ? 's' : ''} 
                    <span className="mx-1">•</span>
                    <span className="font-medium">{breakSummary.totalBreakHours}h</span>
                  </div>
                )}
                
                <button
                  onClick={handleBreakToggle}
                  disabled={isButtonDisabled}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ml-auto ${
                    status === "ON_BREAK"
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {status === "ON_BREAK" ? (
                    <>
                      <Timer size={14} /> End Break
                    </>
                  ) : (
                    <>
                      <Coffee size={14} /> Start Break
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Work Hours Counter */}
          <div className="flex items-center gap-4 p-4 bg-red-500/9 border border-red-100 rounded-xl h-fit">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-red-50">
              <ArrowRightLeft size={20} className="text-gray-500 -rotate-45" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">Today's Hours</h4>
              <WorkHoursCounter
                clockInTime={clockInTime}
                clockOutTime={clockOutTime}
                status={status}
                totalBreakDuration={totalBreakDuration}
                currentBreakDuration={currentBreakDuration}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => {
          setShowCamera(false);
          setCameraAction(null);
        }}
        onCapture={handleCameraCapture}
        actionType={cameraAction}
      />
    </>
  );
};

export default AttendanceTopBar;