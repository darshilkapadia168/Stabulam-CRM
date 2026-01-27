// controllers/workplaceLocationController.js
const WorkplaceLocation = require("../models/workplaceLocation.model");

/**
 * Create a new workplace location
 */
exports.createLocation = async (req, res) => {
    try {
        const { locationName, address, latitude, longitude, radius, locationType } = req.body;
        const createdBy = req.user._id;

        // Validation
        if (!locationName || !latitude || !longitude) {
            return res.status(400).json({
                message: "Location name, latitude, and longitude are required",
            });
        }

        // Check if location name already exists
        const existingLocation = await WorkplaceLocation.findOne({
            locationName: { $regex: new RegExp(`^${locationName}$`, "i") },
        });

        if (existingLocation) {
            return res.status(400).json({
                message: "A location with this name already exists",
            });
        }

        const location = await WorkplaceLocation.create({
            locationName,
            address,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            radius: radius || 500,
            locationType: locationType || "OFFICE",
            createdBy,
        });

        return res.status(201).json({
            message: "Workplace location created successfully",
            data: location,
        });
    } catch (error) {
        console.error("Create Location Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get all workplace locations
 */
exports.getAllLocations = async (req, res) => {
    try {
        const { isActive } = req.query;
        const filter = {};

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        const locations = await WorkplaceLocation.find(filter)
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Locations retrieved successfully",
            data: locations,
            count: locations.length,
        });
    } catch (error) {
        console.error("Get Locations Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get a single location by ID
 */
exports.getLocationById = async (req, res) => {
    try {
        const { id } = req.params;

        const location = await WorkplaceLocation.findById(id).populate(
            "createdBy",
            "name email"
        );

        if (!location) {
            return res.status(404).json({
                message: "Location not found",
            });
        }

        return res.status(200).json({
            message: "Location retrieved successfully",
            data: location,
        });
    } catch (error) {
        console.error("Get Location Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Update a workplace location
 */
exports.updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { locationName, address, latitude, longitude, radius, locationType, isActive } = req.body;

        const location = await WorkplaceLocation.findById(id);

        if (!location) {
            return res.status(404).json({
                message: "Location not found",
            });
        }

        // Update fields
        if (locationName) location.locationName = locationName;
        if (address !== undefined) location.address = address;
        if (latitude) location.latitude = parseFloat(latitude);
        if (longitude) location.longitude = parseFloat(longitude);
        if (radius) location.radius = parseFloat(radius);
        if (locationType) location.locationType = locationType;
        if (isActive !== undefined) location.isActive = isActive;

        await location.save();

        return res.status(200).json({
            message: "Location updated successfully",
            data: location,
        });
    } catch (error) {
        console.error("Update Location Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Delete a workplace location
 */
exports.deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;

        const location = await WorkplaceLocation.findByIdAndDelete(id);

        if (!location) {
            return res.status(404).json({
                message: "Location not found",
            });
        }

        return res.status(200).json({
            message: "Location deleted successfully",
        });
    } catch (error) {
        console.error("Delete Location Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Verify if user's location is within any workplace location
 */
exports.verifyLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                message: "Latitude and longitude are required",
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // Get all active locations
        const locations = await WorkplaceLocation.find({ isActive: true });

        // Check which locations the user is within
        const matchingLocations = locations.filter((location) =>
            location.isWithinRadius(lat, lng)
        );

        if (matchingLocations.length === 0) {
            return res.status(200).json({
                message: "Not within any workplace location",
                isWithinRange: false,
                data: null,
                nearestLocation: await findNearestLocation(lat, lng, locations),
            });
        }

        // Return the first matching location (or you can return all)
        return res.status(200).json({
            message: "Within workplace location",
            isWithinRange: true,
            data: matchingLocations[0],
            allMatches: matchingLocations,
        });
    } catch (error) {
        console.error("Verify Location Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Helper function to find nearest location
 */
async function findNearestLocation(lat, lng, locations) {
    if (!locations || locations.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    locations.forEach((location) => {
        const distance = calculateDistance(lat, lng, location.latitude, location.longitude);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = {
                locationName: location.locationName,
                distance: Math.round(distance),
            };
        }
    });

    return nearest;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}