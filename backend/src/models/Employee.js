const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    reportingManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    jobInfo: {
        employeeId: { type: String, unique: true, sparse: true },
        department: { type: String, default: 'Unassigned' },
        designation: { type: String, default: 'New Hire' },
        joiningDate: { type: Date },
        location: { type: String },
        employmentType: { type: String, default: 'Full-time' },
        // 🕒 NEW: Work timing fields for attendance tracking
        startTime: { 
            type: String, 
            default: '09:00',
            validate: {
                validator: function(v) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'Start time must be in HH:MM format (e.g., 09:00)'
            }
        },
        endTime: { 
            type: String, 
            default: '18:00',
            validate: {
                validator: function(v) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'End time must be in HH:MM format (e.g., 18:00)'
            }
        }
    },
    personalDetails: {
        dob: Date,
        gender: String,
        nationality: String,
        maritalStatus: String
    },
    contactInfo: {
        secondaryEmail: String,
        phone: String,
        address: String,
        emergencyContact: String
    },
    payroll: {
        bankName: String,
        branchName: String,
        bankAcc: String,
        ifsc: String,
        pan: String,
        salary: Number
    },
    status: {
        type: String,
        enum: ['Onboarding', 'Active', 'Inactive'],
        default: 'Onboarding'
    },
    skills: [String],
    tools: [String],

    previousExperience: [
        {
            company: String,
            role: String,
            duration: String
        }
    ],

    portfolio: String,
    documents: [{
        title: String,
        fileUrl: String,
        category: String,
        status: { type: String, enum: ['Verified', 'Pending', 'Rejected'], default: 'Pending' },
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

EmployeeSchema.virtual('isAdminProfile').get(function () {
    return this.userId && (this.userId.role === 'super_admin' || this.userId.role === 'admin');
});

// 🕒 Virtual to calculate total work hours per day
EmployeeSchema.virtual('workingHours').get(function () {
    if (!this.jobInfo.startTime || !this.jobInfo.endTime) return null;
    
    const [startHour, startMin] = this.jobInfo.startTime.split(':').map(Number);
    const [endHour, endMin] = this.jobInfo.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const totalMinutes = endMinutes - startMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes, totalMinutes };
});

EmployeeSchema.set('toJSON', { virtuals: true });
EmployeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);