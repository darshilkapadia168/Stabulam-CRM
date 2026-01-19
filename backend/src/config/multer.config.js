const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const avatarDir = './uploads/avatars';
const documentDir = './uploads/documents';
const attendanceDir = './uploads/attendance'; // ✅ NEW: Attendance photos directory

// ✅ IMPROVED: Check if 'uploads' is a file and delete it
const uploadsPath = './uploads';
if (fs.existsSync(uploadsPath)) {
    const stats = fs.statSync(uploadsPath);
    if (stats.isFile()) {
        console.log('⚠️ Found "uploads" as a file. Deleting it...');
        fs.unlinkSync(uploadsPath);
        console.log('✅ Deleted "uploads" file');
    }
}

// Create directories
[avatarDir, documentDir, attendanceDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// ✅ Storage for employee documents
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, documentDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: employeeId_timestamp_originalname
        const employeeId = req.params.id || 'temp';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${employeeId}_${uniqueSuffix}${ext}`);
    }
});

// ✅ Storage for avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar_${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// ✅ NEW: Storage for attendance photos
const attendanceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, attendanceDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user?._id || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `attendance-${userId}-${uniqueSuffix}${ext}`);
    }
});

// ✅ File filter for documents
const documentFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, and image files are allowed!'));
    }
};

// ✅ File filter for avatars
const avatarFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, JPG, PNG) are allowed for avatars!'));
    }
};

// ✅ NEW: File filter for attendance photos
const attendanceFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed for attendance!'));
    }
};

// ✅ Create multer instances
const uploadDocument = multer({
    storage: documentStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: documentFilter
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit for avatars
    },
    fileFilter: avatarFilter
});

// ✅ NEW: Multer instance for attendance photos
const uploadAttendance = multer({
    storage: attendanceStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for attendance photos
    },
    fileFilter: attendanceFilter
});

module.exports = {
    uploadDocument,
    uploadAvatar,
    uploadAttendance // ✅ NEW: Export attendance upload
};