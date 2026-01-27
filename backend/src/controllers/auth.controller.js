const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const ROLE_PERMISSIONS = require("../config/roles.config");

// ✅ REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate role
    const allowedRoles = [
      "admin",
      "management",
      "team_leader",
      "sr_employee",
      "jr_employee",
      "intern",
    ];
    const safeRole = allowedRoles.includes(role) ? role : "intern";

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: safeRole,
      status: "pending",
      isApproved: false,
    });

    res.status(201).json({
      message: "Registration successful! Your account is pending approval by Super Admin.",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check status
    if (user.status === "pending") {
      return res.status(403).json({
        message: "Your account is pending approval by Super Admin. Please wait for activation.",
      });
    }
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator.",
      });
    }
    if (user.status === "suspended") {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact the administrator.",
      });
    }
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is not active. Please contact the administrator.",
      });
    }

    // Permissions
    const permissions = ROLE_PERMISSIONS[user.role] || {};

    // JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved,
        permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
