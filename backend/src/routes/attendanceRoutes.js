const express = require("express");
const router = express.Router();
const {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getLiveAttendanceStatus,
} = require("../controllers/attendanceController");
const { auth } = require("../middleware/auth");
const { uploadAttendance } = require("../config/multer.config"); // ✅ Correct import

// Clock in/out with photo upload
router.post("/clock-in", auth, uploadAttendance.single("photo"), clockIn);
router.post("/clock-out", auth, uploadAttendance.single("photo"), clockOut);

// Break management
router.post("/break/start", auth, startBreak);
router.post("/break/end", auth, endBreak);

// Live status
router.get("/live-status", auth, getLiveAttendanceStatus);

module.exports = router;