const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true, 
      match: /^\S+@\S+\.\S+$/ 
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "management", "team_leader", "sr_employee", "jr_employee", "intern"],
      default: "intern",
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending", 
    },
    isApproved: { type: Boolean, default: false },
    avatar: { type: String, default: "" },
    permissions: {
      type: Object,
      default: {
        dashboard: { view: false },
        usermanagement: { 
          view: false, 
          create: false, 
          update: false, 
          delete: false 
        },
        employees: { 
          view: false, 
          create: false, 
          edit: false, 
          delete: false 
        }
      },
    },
  },
  { timestamps: true, minimize: false }
);

/**
 * 🔹 PRE-SAVE: Auto-assign permissions
 */
userSchema.pre("save", function (next) {
  // 🔹 CRITICAL FIX: ALWAYS enforce full permissions for super_admin and admin
  // This runs EVERY TIME, regardless of whether it's new or modified
  if (this.role === "super_admin" || this.role === "admin") {
    this.permissions = {
      dashboard: { view: true },
      usermanagement: { 
        view: true, 
        create: true, 
        update: true, 
        delete: true 
      },
      employees: { 
        view: true, 
        create: true, 
        edit: true, 
        delete: true 
      }
    };
    this.status = "active";
    this.isApproved = true;
    return next(); // Exit early - don't run any other logic
  }

  // 🔹 2. MANUAL OVERRIDE CHECK
  // If a Super Admin manually edited permissions for a lower role, don't overwrite them.
  // This only applies to non-admin roles
  if (this.isModified("permissions") && !this.isModified("role")) {
    this.isApproved = this.status === "active";
    return next();
  }

  // 🔹 3. DEFAULT ROLE ASSIGNMENT FOR NON-ADMIN ROLES
  // This only runs for new users or when role changes (and they're not admin)
  if (this.isNew || this.isModified("role")) {
    const managementAccess = { 
      dashboard: { view: true },
      usermanagement: { 
        view: true, 
        create: true, 
        update: true, 
        delete: false 
      },
      employees: { 
        view: true, 
        create: true, 
        edit: true, 
        delete: false 
      }
    };

    const employeeAccess = { 
      dashboard: { view: true },
      usermanagement: { 
        view: false, 
        create: false, 
        update: false, 
        delete: false 
      },
      employees: { 
        view: true, 
        create: false, 
        edit: false, 
        delete: false 
      }
    };

    const restrictedAccess = {
      dashboard: { view: false },
      usermanagement: { 
        view: false, 
        create: false, 
        update: false, 
        delete: false 
      },
      employees: { 
        view: false, 
        create: false, 
        edit: false, 
        delete: false 
      }
    };

    switch (this.role) {
      case "management":
        this.permissions = managementAccess;
        break;
      case "team_leader":
      case "sr_employee":
        this.permissions = employeeAccess;
        break;
      case "jr_employee":
      case "intern":
        this.permissions = restrictedAccess;
        break;
      default:
        this.permissions = restrictedAccess;
        break;
    }
  }

  this.isApproved = this.status === "active";
  next();
});

/**
 * 🔹 POST-SAVE: Safe Employee Profile Initialization
 */
userSchema.post("save", async function (doc, next) {
  // Logic: Create profile for all roles EXCEPT super_admin
  if (doc.role !== "super_admin") {
    try {
      if (!mongoose.models.Employee) {
        console.log("⚠️ Employee model not loaded yet, skipping profile creation");
        return next();
      }
      
      const EmployeeModel = mongoose.model("Employee");
      const employeeExists = await EmployeeModel.findOne({ userId: doc._id });
      
      if (!employeeExists) {
        await EmployeeModel.create({
          userId: doc._id,
          jobInfo: {
            designation: doc.role.replace("_", " ").toUpperCase(),
            employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}` 
          },
          status: "Onboarding"
        });
        console.log(`✅ Employee profile created for ${doc.name}`);
      }
    } catch (error) {
      console.error("❌ Employee profile auto-creation failed:", error.message);
    }
  }
  next();
});

// Virtuals and Methods
userSchema.virtual("isPrivilegedUser").get(function () {
  return this.role === "super_admin" || this.role === "admin";
});

userSchema.methods.hasPermission = function (moduleName, action) {
  if (this.role === "super_admin" || this.role === "admin") return true;
  return this.permissions?.[moduleName]?.[action] === true;
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);