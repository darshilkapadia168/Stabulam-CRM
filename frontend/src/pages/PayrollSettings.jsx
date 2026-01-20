// PayrollSettings.jsx - Fixed with Auth Token

import { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign, Clock, AlertTriangle, TrendingUp, Save, RefreshCw, Info } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PayrollSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Get token from localStorage
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Fetch payroll settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      
      // ✅ Include auth token
      const res = await axios.get(`${API_URL}/api/daily-logs/deduction-rules`, getAuthConfig());
      
      if (res.data?.data) {
        setSettings(res.data.data);
      } else {
        // Default values if nothing exists
        setSettings({
          latePenaltyPerMinute: 10,
          earlyExitPenaltyPerMinute: 15,
          absentFullDayPenalty: 1000,
          halfDayPenalty: 500,
          minimumOvertimeMinutes: 30,
          overtimeRatePerMinute: 5,
          graceLateMinutes: 15,
          graceEarlyMinutes: 15,
          standardShiftMinutes: 480,
          halfDayThresholdMinutes: 240,
          isActive: true,
        });
      }
    } catch (err) {
      console.error("Fetch Settings Error:", err);
      setError(err.response?.data?.message || "Failed to load payroll settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : Number(value),
    });
  };

  // Submit updated settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      // ✅ Include auth token
      const res = await axios.put(`${API_URL}/api/daily-logs/deduction-rules`, settings, getAuthConfig());
      
      setSuccessMessage(res.data.message || "Payroll settings updated successfully!");
      
      // Refresh settings
      await fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Update Settings Error:", err);
      setError(err.response?.data?.message || "Failed to save payroll settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payroll settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load settings</p>
          <button
            onClick={fetchSettings}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <DollarSign size={28} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Settings</h1>
            <p className="text-gray-600 mt-1">Configure attendance deductions and overtime rates</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Info size={20} className="text-green-600" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Penalties Section */}
        <div className="bg-white rounded-xl border-2 border-red-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Penalty Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Late Penalty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Late Penalty (₹ per minute)
              </label>
              <input
                type="number"
                name="latePenaltyPerMinute"
                value={settings.latePenaltyPerMinute}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">After grace period</p>
            </div>

            {/* Early Exit Penalty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Early Exit Penalty (₹ per minute)
              </label>
              <input
                type="number"
                name="earlyExitPenaltyPerMinute"
                value={settings.earlyExitPenaltyPerMinute}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Before shift end</p>
            </div>

            {/* Full Day Absent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Day Absent Penalty (₹)
              </label>
              <input
                type="number"
                name="absentFullDayPenalty"
                value={settings.absentFullDayPenalty}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Fixed deduction</p>
            </div>

            {/* Half Day Penalty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Half Day Penalty (₹)
              </label>
              <input
                type="number"
                name="halfDayPenalty"
                value={settings.halfDayPenalty}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Less than threshold hours</p>
            </div>
          </div>
        </div>

        {/* Grace Periods */}
        <div className="bg-white rounded-xl border-2 border-blue-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" />
            Grace Periods
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Late Grace (minutes)
              </label>
              <input
                type="number"
                name="graceLateMinutes"
                value={settings.graceLateMinutes}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Early Exit Grace (minutes)
              </label>
              <input
                type="number"
                name="graceEarlyMinutes"
                value={settings.graceEarlyMinutes}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Shift Configuration */}
        <div className="bg-white rounded-xl border-2 border-purple-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={24} className="text-purple-600" />
            Shift Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Standard Shift (minutes) - {(settings.standardShiftMinutes / 60).toFixed(1)}h
              </label>
              <input
                type="number"
                name="standardShiftMinutes"
                value={settings.standardShiftMinutes}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Half Day Threshold (minutes) - {(settings.halfDayThresholdMinutes / 60).toFixed(1)}h
              </label>
              <input
                type="number"
                name="halfDayThresholdMinutes"
                value={settings.halfDayThresholdMinutes}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Overtime */}
        <div className="bg-white rounded-xl border-2 border-green-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-green-600" />
            Overtime Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Overtime (minutes)
              </label>
              <input
                type="number"
                name="minimumOvertimeMinutes"
                value={settings.minimumOvertimeMinutes}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Overtime Rate (₹ per minute)
              </label>
              <input
                type="number"
                name="overtimeRatePerMinute"
                value={settings.overtimeRatePerMinute}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <input
            type="checkbox"
            name="isActive"
            checked={settings.isActive}
            onChange={handleChange}
            className="w-5 h-5 text-indigo-600"
          />
          <label className="text-lg font-semibold text-gray-900">
            Active Setting
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} />
            Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}