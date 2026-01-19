const express = require("express");
const router = express.Router();
const { uploadDocument, uploadAvatar } = require("../config/multer.config");
const employeeController = require("../controllers/employeeController");

const { auth, superAdminOnly } = require("../middleware/auth");
const { can } = require("../middleware/permissions");

// ✅ 1. Create New Employee
// Access: Super Admin, Admin, OR users with 'create' permission for 'employees' module
router.post(
  "/",
  auth,
  can('employees', 'create'),
  employeeController.createEmployee
);

// ✅ 2. Get All Employees (Directory Grid)
// Access: Super Admin, Admin, OR users with 'view' permission for 'employees' module
router.get(
  "/", 
  auth,
  can('employees', 'view'),
  employeeController.getAllEmployees
);

// ✅ 3. Get Single Employee Details
// Access: Super Admin, Admin, OR users with 'view' permission for 'employees' module
router.get(
  "/:id", 
  auth,
  can('employees', 'view'),
  employeeController.getEmployeeById
);

// ✅ 4. Update Employee Profile
// Access: Super Admin, Admin, OR users with 'edit' permission for 'employees' module
router.put(
  "/:id", 
  auth,
  can('employees', 'edit'),
  employeeController.updateEmployee
);

// ✅ 5. Deactivate Employee (Soft Delete)
// Access: Super Admin, Admin, OR users with 'delete' permission for 'employees' module
router.delete(
  "/:id", 
  auth,
  can('employees', 'delete'),
  employeeController.deactivateEmployee
);

// ✅ 6. Document Upload
// Access: Super Admin, Admin, OR users with 'edit' permission for 'employees' module
router.post(
  "/:id/documents",
  auth,
  can('employees', 'edit'),
  uploadDocument.single('document'),
  employeeController.uploadDocument
);

// ✅ 7. Get Employee Documents
// Access: Super Admin, Admin, OR users with 'view' permission for 'employees' module
router.get(
  "/:id/documents",
  auth,
  can('employees', 'view'),
  employeeController.getEmployeeDocuments
);

// ✅ 8. Delete Document
// Access: Super Admin, Admin, OR users with 'delete' permission for 'employees' module
router.delete(
  "/:id/documents/:docId",
  auth,
  can('employees', 'delete'),
  employeeController.deleteDocument
);

module.exports = router;