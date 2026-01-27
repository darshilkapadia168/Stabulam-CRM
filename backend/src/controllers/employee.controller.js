const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee.model');
const User = require('../models/User.model');


// 🔹 CREATE NEW EMPLOYEE (User + Employee Profile)

exports.createEmployee = async (req, res) => {
  try {
    const {
      userId,
      personalDetails = {},
      contactInfo = {},
      jobInfo = {},
      payroll = {},
      reportingManager = null,
      skills = [],
      tools = [],
      previousExperience = [],
      portfolio = null,
      documents = []
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIX: Check if employee profile already exists
    const existingEmployee = await Employee.findOne({ userId });

    if (existingEmployee) {
      // Merge new data into existing employee
      existingEmployee.skills = skills.length ? skills : existingEmployee.skills;
      existingEmployee.tools = tools.length ? tools : existingEmployee.tools;
      existingEmployee.previousExperience = previousExperience.length
        ? previousExperience
        : existingEmployee.previousExperience;
      existingEmployee.portfolio = portfolio || existingEmployee.portfolio;

      if (jobInfo && Object.keys(jobInfo).length > 0) {
        existingEmployee.jobInfo = { ...existingEmployee.jobInfo, ...jobInfo };
      }
      if (personalDetails && Object.keys(personalDetails).length > 0) {
        existingEmployee.personalDetails = { ...existingEmployee.personalDetails, ...personalDetails };
      }
      if (contactInfo && Object.keys(contactInfo).length > 0) {
        existingEmployee.contactInfo = { ...existingEmployee.contactInfo, ...contactInfo };
      }
      if (payroll && Object.keys(payroll).length > 0) {
        existingEmployee.payroll = { ...existingEmployee.payroll, ...payroll };
      }
      if (reportingManager) {
        existingEmployee.reportingManager = reportingManager;
      }

      await existingEmployee.save();

      const populatedEmployee = await Employee.findById(existingEmployee._id)
        .populate("userId", "name email role status");

      return res.status(200).json({
        success: true,
        message: "Employee profile updated successfully",
        employee: populatedEmployee
      });
    }


    // Create new employee if not exists
    const employee = await Employee.create({
      userId,
      reportingManager,
      jobInfo: {
        employeeId: jobInfo.employeeId || `EMP-${Date.now()}`,
        department: jobInfo.department || "Unassigned",
        designation: jobInfo.designation || "New Hire",
        joiningDate: jobInfo.joiningDate || new Date(),
        location: jobInfo.location || null,
        employmentType: jobInfo.employmentType || "Full-time",
        // 🕒 NEW: Add start and end time
        startTime: jobInfo.startTime || "09:00",
        endTime: jobInfo.endTime || "18:00"
      },
      personalDetails: {
        dob: personalDetails.dob || null,
        gender: personalDetails.gender || null,
        nationality: personalDetails.nationality || null,
        maritalStatus: personalDetails.maritalStatus || null
      },
      contactInfo: {
        phone: contactInfo.phone || null,
        secondaryEmail: contactInfo.secondaryEmail || null,
        address: contactInfo.address || null,
        emergencyContact: contactInfo.emergencyContact || null
      },
      payroll: {
        bankName: payroll.bankName || null,
        branchName: payroll.branchName || null,
        bankAcc: payroll.bankAcc || null,
        ifsc: payroll.ifsc || null,
        pan: payroll.pan || null,
        salary: payroll.salary || null
      },
      skills,
      tools,
      previousExperience,
      portfolio,
      documents
    });

    

    const populatedEmployee = await Employee.findById(employee._id)
      .populate("userId", "name email role status");

    res.status(201).json({
      success: true,
      message: "Employee profile created successfully",
      employee: populatedEmployee
    });

  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




// 🔹 GET ALL EMPLOYEES (with Search & Filters)
exports.getAllEmployees = async (req, res) => {
  try {
    const { search, department, status, sortBy = 'newest' } = req.query;
    let query = {};

    if (department && department !== 'All Departments') {
      query['jobInfo.department'] = department;
    }

    let employees = await Employee.find(query)
      .populate({
        path: 'userId',
        select: 'name email role avatar status isApproved'
      })
      .populate({
        path: 'reportingManager',
        populate: { path: 'userId', select: 'name avatar' }
      })
      .lean();

    employees = employees.filter(emp => emp.userId);

    if (status && status !== 'All') {
      employees = employees.filter(emp => {
        if (status === 'Active') return emp.userId.status === 'active';
        if (status === 'Inactive') return emp.userId.status === 'inactive';
        if (status === 'Onboarding') return emp.status === 'Onboarding';
        return true;
      });
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      employees = employees.filter(emp =>
        searchRegex.test(emp.userId?.name) ||
        searchRegex.test(emp.jobInfo?.designation) ||
        searchRegex.test(emp.jobInfo?.employeeId)
      );
    }

    employees.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'name') {
        return (a.userId?.name || '').localeCompare(b.userId?.name || '');
      }
      return 0;
    });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees",
      error: error.message
    });
  }
};

// ... rest of your existing controller methods (getEmployeeById, updateEmployee, etc.)
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'name email role avatar status')
      .populate({
        path: 'reportingManager',
        populate: { path: 'userId', select: 'name' }
      });

    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employee", error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const isPrivileged = req.user.role === 'super_admin' || req.user.role === 'admin';

    if (!isPrivileged) {
      return res.status(403).json({ message: "Access denied. Only Admins can update profiles." });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!updatedEmployee) return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "Profile updated successfully", employee: updatedEmployee });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

exports.deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "Employee deactivated", employee });
  } catch (error) {
    res.status(500).json({ message: "Deactivation failed", error: error.message });
  }
};





exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category } = req.body;

    // Validate file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    // Find employee
    const employee = await Employee.findById(id);
    if (!employee) {
      // Delete uploaded file if employee not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ 
        success: false,
        message: "Employee not found" 
      });
    }

    // Create document object
    const newDocument = {
      title: title || req.file.originalname,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      category: category || 'Other',
      uploadedAt: new Date()
    };

    // Add to employee documents
    employee.documents.push(newDocument);
    await employee.save();

    // Get the newly added document with _id
    const addedDocument = employee.documents[employee.documents.length - 1];

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      document: addedDocument
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      success: false,
      message: "Upload failed", 
      error: error.message 
    });
  }
};

exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id).select('documents');
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Employee not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      documents: employee.documents || [] 
    });

  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching documents", 
      error: error.message 
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    // Find employee
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Employee not found" 
      });
    }

    // Find document index
    const docIndex = employee.documents.findIndex(
      doc => doc._id.toString() === docId
    );

    if (docIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }

    // Get file path and delete from filesystem
    const fileUrl = employee.documents[docIndex].fileUrl;
    const filePath = path.join(__dirname, '../', fileUrl);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      } catch (fileError) {
        console.error('⚠️ Could not delete file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    } else {
      console.warn('⚠️ File not found on disk:', filePath);
    }

    // Remove from database
    employee.documents.splice(docIndex, 1);
    await employee.save();

    res.status(200).json({ 
      success: true,
      message: "Document deleted successfully" 
    });

  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ 
      success: false,
      message: "Delete failed", 
      error: error.message 
    });
  }
};

exports.updateDocumentStatus = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const { status } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Employee not found" 
      });
    }

    const document = employee.documents.id(docId);
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }

    document.status = status;
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Document status updated to ${status}`,
      document
    });

  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({ 
      success: false,
      message: "Status update failed", 
      error: error.message 
    });
  }
};