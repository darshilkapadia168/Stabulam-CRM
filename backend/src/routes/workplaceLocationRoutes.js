// routes/workplaceLocationRoutes.js
const express = require("express");
const router = express.Router();
const {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation,
    verifyLocation,
} = require("../controllers/workplaceLocationController");
const { auth } = require("../middleware/auth");

// Create a new workplace location
router.post("/", auth, createLocation);

// Get all workplace locations
router.get("/", auth, getAllLocations);

// Verify if user is within a workplace location
router.post("/verify", auth, verifyLocation);

// Get a single location by ID
router.get("/:id", auth, getLocationById);

// Update a workplace location
router.put("/:id", auth, updateLocation);

// Delete a workplace location
router.delete("/:id", auth, deleteLocation);

module.exports = router;