// scripts/migratePayrollSetting.js
// Run this script to add new fields to existing PayrollSetting documents

const mongoose = require("mongoose");
const PayrollSetting = require("../models/PayrollSetting");
require("dotenv").config();

async function migratePayrollSettings() {
    try {
        console.log("🔄 Starting PayrollSetting migration...");

        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to database");

        // Find all existing PayrollSettings
        const existingSettings = await PayrollSetting.find({});
        console.log(`📊 Found ${existingSettings.length} existing settings`);

        if (existingSettings.length === 0) {
            console.log("⚠️  No existing settings found. Creating default setting...");

            // Create default PayrollSetting
            const defaultSetting = new PayrollSetting({
                latePenaltyPerMinute: 10,
                earlyExitPenaltyPerMinute: 15,
                absentFullDayPenalty: 1000,
                halfDayPenalty: 500,  // 🆕 NEW
                minimumOvertimeMinutes: 30,
                overtimeRatePerMinute: 5,
                graceLateMinutes: 15,
                graceEarlyMinutes: 15,
                standardShiftMinutes: 480,
                halfDayThresholdMinutes: 240,  // 🆕 NEW
                isActive: true,
            });

            await defaultSetting.save();
            console.log("✅ Default PayrollSetting created successfully");
        } else {
            // Update existing settings with new fields
            for (const setting of existingSettings) {
                let updated = false;

                // Add halfDayPenalty if missing
                if (setting.halfDayPenalty === undefined) {
                    setting.halfDayPenalty = 500;
                    updated = true;
                    console.log(`  ➕ Added halfDayPenalty: 500`);
                }

                // Add halfDayThresholdMinutes if missing
                if (setting.halfDayThresholdMinutes === undefined) {
                    setting.halfDayThresholdMinutes = 240;
                    updated = true;
                    console.log(`  ➕ Added halfDayThresholdMinutes: 240`);
                }

                if (updated) {
                    await setting.save();
                    console.log(`✅ Updated PayrollSetting: ${setting._id}`);
                } else {
                    console.log(`ℹ️  PayrollSetting ${setting._id} already has all fields`);
                }
            }
        }

        console.log("\n🎉 Migration completed successfully!");

        // Display current settings
        const currentSettings = await PayrollSetting.find({});
        console.log("\n📋 Current PayrollSettings:");
        currentSettings.forEach((setting, index) => {
            console.log(`\nSetting #${index + 1}:`);
            console.log(`  ID: ${setting._id}`);
            console.log(`  Active: ${setting.isActive}`);
            console.log(`  Late Penalty: ₹${setting.latePenaltyPerMinute}/min`);
            console.log(`  Early Exit Penalty: ₹${setting.earlyExitPenaltyPerMinute}/min`);
            console.log(`  Absent Penalty: ₹${setting.absentFullDayPenalty}`);
            console.log(`  Half Day Penalty: ₹${setting.halfDayPenalty} 🆕`);
            console.log(`  Half Day Threshold: ${setting.halfDayThresholdMinutes} min 🆕`);
            console.log(`  Grace Late: ${setting.graceLateMinutes} min`);
            console.log(`  Grace Early: ${setting.graceEarlyMinutes} min`);
            console.log(`  Standard Shift: ${setting.standardShiftMinutes} min`);
            console.log(`  Min Overtime: ${setting.minimumOvertimeMinutes} min`);
            console.log(`  OT Rate: ₹${setting.overtimeRatePerMinute}/min`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run migration
migratePayrollSettings();

