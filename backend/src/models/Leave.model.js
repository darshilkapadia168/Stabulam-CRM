const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    date: {
        type: String, // YYYY-MM-DD
    },
    status: {
        type: String,
        enum: ["APPROVED", "PENDING", "REJECTED"],
    },
});

module.exports = mongoose.model("Leave", leaveSchema);
