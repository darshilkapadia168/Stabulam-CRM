const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const UserHistory = require("../models/UserHistory.model");

/**
 * ============================
 * GET ALL USERS
 * Permission: usermanagement -> showusers
 * ============================
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ============================
 * GET USER HISTORY
 * Permission: admin or super_admin only
 * ============================
 */
exports.getUserHistory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can view user history."
      });
    }

    const history = await UserHistory.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ============================
 * GET PENDING USERS
 * Only Super Admin
 * ============================
 */
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingUsers.length,
      users: pendingUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ============================
 * CREATE USER
 * Permission: usermanagement -> create
 * ============================
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const allowedRoles = [
      "super_admin",
      "admin",
      "management",
      "team_leader",
      "sr_employee",
      "jr_employee",
      "intern",
    ];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "intern",
      status: "active",
      isApproved: true,
    });

    // ✅ LOG USER CREATION
    await UserHistory.create({
      userId: user._id,
      actionType: 'created',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      changes: {
        description: `User account created with email ${user.email} and role ${user.role}`
      }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ============================
 * APPROVE USER (DEPRECATED)
 * Only Super Admin
 * ============================
 */
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const oldStatus = user.status;
    user.status = "active";
    user.isApproved = true;
    await user.save();

    // ✅ LOG STATUS CHANGE
    await UserHistory.create({
      userId: user._id,
      actionType: 'status_changed',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      changes: {
        field: 'status',
        oldValue: oldStatus,
        newValue: 'active',
        description: `User approved - status changed from ${oldStatus} to active`
      }
    });

    res.json({ message: "User approved successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ============================
 * UPDATE USER STATUS
 * Only Super Admin
 * ============================
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "active", "inactive", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString() && user.role === "super_admin") {
      return res.status(403).json({ message: "Super Admin cannot change their own status" });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // ✅ LOG STATUS CHANGE
    await UserHistory.create({
      userId: user._id,
      actionType: 'status_changed',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      changes: {
        field: 'status',
        oldValue: oldStatus,
        newValue: status,
        description: `Status changed from ${oldStatus} to ${status}`
      }
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ============================
 * UPDATE USER
 * Permission: usermanagement -> update
 * ============================
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, password, permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const changes = [];

    if (name && name !== user.name) {
      changes.push({
        field: 'name',
        oldValue: user.name,
        newValue: name,
        description: `Name changed from "${user.name}" to "${name}"`
      });
      user.name = name;
    }

    if (email && email !== user.email) {
      changes.push({
        field: 'email',
        oldValue: user.email,
        newValue: email,
        description: `Email changed from ${user.email} to ${email}`
      });
      user.email = email;
    }

    if (role && role !== user.role) {
      changes.push({
        field: 'role',
        oldValue: user.role,
        newValue: role,
        description: `Role changed from ${user.role} to ${role}`
      });
      user.role = role;
    }

    if (password) {
      changes.push({
        field: 'password',
        oldValue: '***',
        newValue: '***',
        description: 'Password was changed'
      });
      user.password = await bcrypt.hash(password, 10);
    }

    if (permissions && req.user.role === "super_admin") {
      changes.push({
        field: 'permissions',
        oldValue: user.permissions,
        newValue: permissions,
        description: 'Permissions were modified'
      });
      user.permissions = permissions;
    }

    await user.save();

    // Log each change
    for (const change of changes) {
      await UserHistory.create({
        userId: user._id,
        actionType: 'updated',
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: req.user.role,
        changes: change
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ============================
 * UPDATE USER PERMISSIONS
 * Only Super Admin
 * ============================
 */
exports.updateUserPermissions = async (req, res) => {
  
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Update user permissions
    const user = await User.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: false }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    console.log('🔔 Emitting to room:', id);
  console.log('🔔 Permissions being sent:', user.permissions);

    // 🔹 NEW: Emit socket event to notify the user
    const io = req.app.get('io');
    io.to(id).emit('permissions-updated', {
      permissions: user.permissions,
      message: 'Your permissions have been updated by an administrator'
    });

    console.log(`🔔 Emitted permission update to user: ${id}`);

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
      error: error.message
    });
  }
};

/**
 * ============================
 * DELETE USER
 * Permission: usermanagement -> delete
 * ============================
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString() && user.role === "super_admin") {
      return res.status(403).json({
        message: "Super Admin cannot delete their own account",
      });
    }

    await UserHistory.create({
      userId: user._id,
      actionType: 'deleted',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      changes: {
        description: `User ${user.name} (${user.email}) was deleted`
      }
    });

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
