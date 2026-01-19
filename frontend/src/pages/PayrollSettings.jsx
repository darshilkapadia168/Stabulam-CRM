import { useState, useEffect } from "react";
import axios from "axios";

export default function PayrollSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch payroll settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/api/payroll-settings"); // GET backend route
        if (res.data?.data) {
          setSettings(res.data.data);
        } else {
          // Default values if nothing exists
          setSettings({
            latePenaltyPerMinute: 0,
            earlyExitPenaltyPerMinute: 0,
            absentFullDayPenalty: 0,
            minimumOvertimeMinutes: 0,
            overtimeRatePerMinute: 0,
            graceLateMinutes: 15,
            graceEarlyMinutes: 15,
            standardShiftMinutes: 480,
            isActive: true,
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load payroll settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

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
    try {
      const res = await axios.put("/api/payroll-settings", settings); // PUT backend route
      alert(res.data.message || "Payroll settings updated successfully!");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save payroll settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading payroll settings...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Payroll Settings</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block font-medium">Late Penalty per Minute</label>
          <input
            type="number"
            name="latePenaltyPerMinute"
            value={settings.latePenaltyPerMinute}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Early Exit Penalty per Minute</label>
          <input
            type="number"
            name="earlyExitPenaltyPerMinute"
            value={settings.earlyExitPenaltyPerMinute}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Absent Full Day Penalty</label>
          <input
            type="number"
            name="absentFullDayPenalty"
            value={settings.absentFullDayPenalty}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Minimum Overtime Minutes</label>
          <input
            type="number"
            name="minimumOvertimeMinutes"
            value={settings.minimumOvertimeMinutes}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Overtime Rate per Minute</label>
          <input
            type="number"
            name="overtimeRatePerMinute"
            value={settings.overtimeRatePerMinute}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Grace Late Minutes</label>
          <input
            type="number"
            name="graceLateMinutes"
            value={settings.graceLateMinutes}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Grace Early Minutes</label>
          <input
            type="number"
            name="graceEarlyMinutes"
            value={settings.graceEarlyMinutes}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Standard Shift Minutes</label>
          <input
            type="number"
            name="standardShiftMinutes"
            value={settings.standardShiftMinutes}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={settings.isActive}
            onChange={handleChange}
          />
          <label>Active</label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
