const express = require("express");
const { auth, superAdminOnly } = require("../middleware/auth");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route example
router.get("/admin-only", auth, superAdminOnly, (req, res) => {
  res.json({ message: "Welcome, Super Admin!" });
});

module.exports = router;
