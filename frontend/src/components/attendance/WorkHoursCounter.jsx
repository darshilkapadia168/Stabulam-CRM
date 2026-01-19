import { useState, useEffect } from "react";

const WorkHoursCounter = ({
  clockInTime,
  clockOutTime,
  status,
  totalBreakDuration, // in minutes
  currentBreakDuration, // in minutes (for active break)
}) => {
  const [workSeconds, setWorkSeconds] = useState(0);

  useEffect(() => {
    let interval;

    const calculateWorkTime = () => {
      if (!clockInTime) {
        setWorkSeconds(0);
        return;
      }

      const now = status === "CHECKED_OUT" && clockOutTime ? new Date(clockOutTime) : new Date();
      const totalElapsedSeconds = Math.floor((now - new Date(clockInTime)) / 1000);

      // Calculate total break time in seconds
      let totalBreakSeconds = 0;

      if (status === "ON_BREAK") {
        // Include completed breaks + current active break
        totalBreakSeconds = (totalBreakDuration + currentBreakDuration) * 60;
      } else {
        // Only completed breaks
        totalBreakSeconds = totalBreakDuration * 60;
      }

      // Net work time = total elapsed - breaks
      const netWorkSeconds = Math.max(0, totalElapsedSeconds - totalBreakSeconds);
      setWorkSeconds(netWorkSeconds);
    };

    // Update immediately
    calculateWorkTime();

    // Start interval only if checked in or on break (not checked out)
    if (status === "CHECKED_IN" || status === "ON_BREAK") {
      interval = setInterval(calculateWorkTime, 1000); // update every second
    }

    return () => clearInterval(interval);
  }, [clockInTime, clockOutTime, status, totalBreakDuration, currentBreakDuration]);

  const h = Math.floor(workSeconds / 3600);
  const m = Math.floor((workSeconds % 3600) / 60);
  const s = workSeconds % 60;

  const formatTime = (date) => {
    if (!date) return "--:--:--";
    const d = new Date(date);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <span className="font-bold text-gray-700 text-xs">Clock In:</span>
        <span className="text-gray-900 text-sm">{formatTime(clockInTime)}</span>
      </div>

      <div className="flex gap-2">
        <span className="font-bold text-gray-700 text-xs">Clock Out:</span>
        <span className="text-gray-900 text-sm">{formatTime(clockOutTime)}</span>
      </div>

      {/* Real-time work hours (excluding breaks) */}
      <span className="text-xl font-black text-gray-900 leading-tight mt-1">
        {h}h {m}m {s}s
      </span>

      <span className="text-[9px] text-gray-400 uppercase font-bold">
        Total working time
      </span>

      {/* Show break info if there are breaks */}
      {(totalBreakDuration > 0 || currentBreakDuration > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-gray-500 font-semibold">Break Time:</span>
            <span className="text-xs text-orange-600 font-bold">
              {Math.floor((totalBreakDuration + currentBreakDuration) / 60)}h{" "}
              {(totalBreakDuration + currentBreakDuration) % 60}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkHoursCounter;