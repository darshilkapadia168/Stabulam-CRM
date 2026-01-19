// models/WorkplaceLocation.js
const mongoose = require("mongoose");

const workplaceLocationSchema = new mongoose.Schema(
    {
        locationName: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
        },
        radius: {
            type: Number,
            default: 500, // meters
            min: 50,
            max: 5000,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        locationType: {
            type: String,
            enum: ["OFFICE", "BRANCH", "WAREHOUSE", "REMOTE", "CLIENT_SITE", "OTHER"],
            default: "OFFICE",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Index for geospatial queries
workplaceLocationSchema.index({ latitude: 1, longitude: 1 });

// Method to check if a point is within radius
workplaceLocationSchema.methods.isWithinRadius = function (lat, lng) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this.latitude * Math.PI) / 180;
    const φ2 = (lat * Math.PI) / 180;
    const Δφ = ((lat - this.latitude) * Math.PI) / 180;
    const Δλ = ((lng - this.longitude) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance <= this.radius;
};

module.exports = mongoose.model("WorkplaceLocation", workplaceLocationSchema);