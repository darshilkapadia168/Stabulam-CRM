const express = require("express");
const { auth, superAdminOnly } = require("../middleware/auth.middleware");
const { can } = require("../middleware/permissions.middleware");
const {
  getUsers,
  getUserHistory,
  getPendingUsers,
  createUser,
  approveUser,
  updateUser,
  updateUserStatus,
  updateUserPermissions,
  deleteUser
} = require("../controllers/user.controller");

const router = express.Router();

router.get("/", auth, can("usermanagement", "view"), getUsers);
router.get("/pending", auth, superAdminOnly, getPendingUsers);
router.get("/:id/history", auth, getUserHistory);

router.post("/", auth, can("usermanagement", "create"), createUser);
router.put("/approve/:id", auth, superAdminOnly, approveUser);
router.put("/:id", auth, can("usermanagement", "update"), updateUser);
router.patch("/:id/status", auth, superAdminOnly, updateUserStatus);
router.patch("/:id/permissions", auth, superAdminOnly, updateUserPermissions);
router.delete("/:id", auth, can("usermanagement", "delete"), deleteUser);

module.exports = router;
