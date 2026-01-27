const express = require("express");
const path = require('path');
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db.config");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTES REGISTRATION
// ============================================

// Auth Routes
const authRoutes = require("./src/routes/auth.routes");
app.use("/api/auth", authRoutes);

// User Routes
const userRoutes = require("./src/routes/user.routes");
app.use("/api/users", userRoutes);

// Employee Routes
const employeeRoutes = require("./src/routes/employee.routes");
app.use("/api/employees", employeeRoutes);

// Attendance Routes
const attendanceRoutes = require('./src/routes/attendance.routes');
app.use("/api/attendance", attendanceRoutes);

// Workplace Location Routes
const workplaceLocationRoutes = require('./src/routes/workplaceLocation.routes');
app.use("/api/workplace-locations", workplaceLocationRoutes);

// Daily Logs Routes
const dailyLogsRoutes = require('./src/routes/dailylogs.routes');
app.use("/api/daily-logs", dailyLogsRoutes);


console.log("✅ All routes registered successfully");

// ============================================
// SOCKET.IO SETUP
// ============================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // adjust origin in production
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // User joins their own room (using their user ID)
  socket.on("join-user-room", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ============================================
// CATCH-ALL ROUTE FOR FRONTEND (Must be LAST)
// ============================================
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ 
      success: false, 
      message: "API endpoint not found",
      path: req.path 
    });
  }
  res.sendFile(path.resolve(frontendPath, "index.html"));
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);