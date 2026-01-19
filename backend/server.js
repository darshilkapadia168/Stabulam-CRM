const express = require("express");
const path = require('path');
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");

console.log("authRoutes type:", typeof authRoutes);
console.log("userRoutes type:", typeof userRoutes);


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

const employeeRoutes = require("./src/routes/employeeRoutes");
app.use("/api/employees", employeeRoutes);

const attendanceRoutes = require('./src/routes/attendanceRoutes')
app.use("/api/attendance", attendanceRoutes);

const breakRoutes = require('./src/routes/breakRoutes')
app.use("/api/break", breakRoutes);

const workplaceLocationRoutes = require('./src/routes/workplaceLocationRoutes');
app.use("/api/workplace-locations", workplaceLocationRoutes);

const dailyLogsRoutes = require('./src/routes/dailylogsRoutes');
app.use("/api/daily-logs", dailyLogsRoutes);


// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: "*" }, // adjust origin in production
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

// Socket.IO connection
// Socket.IO connection
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // 🔹 User joins their own room (using their user ID)
  socket.on("join-user-room", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server using the HTTP server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);


