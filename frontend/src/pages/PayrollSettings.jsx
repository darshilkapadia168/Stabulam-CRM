// components/admin/PayrollSettings.jsx - IMPROVED VERSION

import { useState, useEffect } from "react";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Award,
  Save,
  RotateCcw,
  Coffee,
  CheckCircle,
  LogOut,
  Calendar,
  TrendingUp,
  Info,
  Zap
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api`;

const PayrollSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Late Penalties - Tiered
    lateGracePeriodMinutes: 30,
    latePenalties: {
      after30Minutes: 100,
      after1Hour: 200,
      after1AndHalfHours: 250
    },
    
    // Overtime Bonuses - Tiered
    overtimeBonuses: {
      after1Hour: 150,
      after2Hours: 250,
      after3Hours: 350,
      after4Hours: 450
    },
    
    // Early Exit
    earlyExitGraceMinutes: 15,
    earlyExitPenaltyPerMinute: 15,
    
    // Absence
    absentFullDayPenalty: 1000,
    halfDayPenalty: 500,
    halfDayThresholdMinutes: 240,
    
    // Shift
    standardShiftMinutes: 480,
    
    // Breaks
    maxBreakMinutes: 60,
    excessBreakPenaltyPerMinute: 10,
    
    notes: ""
  });

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/daily-logs/deduction-rules`,
        getAuthConfig()
      );
      setSettings(response.data.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      alert("⚠️ Failed to load settings. Using defaults.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (settings.lateGracePeriodMinutes < 0) {
      alert("⚠️ Grace period cannot be negative");
      return;
    }
    
    if (settings.standardShiftMinutes < 60) {
      alert("⚠️ Standard shift must be at least 60 minutes");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/daily-logs/deduction-rules`,
        settings,
        getAuthConfig()
      );
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("❌ Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("⚠️ Reset to default values? This will discard all current settings.")) {
      setSettings({
        lateGracePeriodMinutes: 30,
        latePenalties: {
          after30Minutes: 100,
          after1Hour: 200,
          after1AndHalfHours: 250
        },
        overtimeBonuses: {
          after1Hour: 150,
          after2Hours: 250,
          after3Hours: 350,
          after4Hours: 450
        },
        earlyExitGraceMinutes: 15,
        earlyExitPenaltyPerMinute: 15,
        absentFullDayPenalty: 1000,
        halfDayPenalty: 500,
        halfDayThresholdMinutes: 240,
        standardShiftMinutes: 480,
        maxBreakMinutes: 60,
        excessBreakPenaltyPerMinute: 10,
        notes: ""
      });
    }
  };

  const calculateEstimatedImpact = () => {
    // Example calculations to show admins the impact
    const avgLateBy60Min = settings.latePenalties.after1Hour;
    const avgOT2Hours = settings.overtimeBonuses.after2Hours;
    
    return {
      worstCaseDaily: settings.latePenalties.after1AndHalfHours + 
                      settings.earlyExitPenaltyPerMinute * 30 + 
                      settings.excessBreakPenaltyPerMinute * 30,
      bestCaseDaily: settings.overtimeBonuses.after4Hours,
      avgPenalty: avgLateBy60Min,
      avgBonus: avgOT2Hours
    };
  };

  const impact = calculateEstimatedImpact();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading payroll settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success Toast */}
        {showSaveSuccess && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in">
            <CheckCircle size={24} />
            <div>
              <p className="font-bold">Settings Saved!</p>
              <p className="text-sm text-green-100">Changes will apply to new attendance logs</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <DollarSign size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                  Payroll Settings
                </h1>
                <p className="text-gray-600 text-lg">
                  Configure tiered penalties and bonuses for attendance
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <RotateCcw size={18} />
                Reset to Default
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Impact Preview */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <Zap size={24} className="text-amber-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Estimated Impact</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Worst Case Daily</p>
                    <p className="text-xl font-bold text-red-600">-₹{impact.worstCaseDaily}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Best Case Daily</p>
                    <p className="text-xl font-bold text-green-600">+₹{impact.bestCaseDaily}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Avg Late Penalty</p>
                    <p className="text-xl font-bold text-orange-600">₹{impact.avgPenalty}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Avg OT Bonus</p>
                    <p className="text-xl font-bold text-blue-600">₹{impact.avgBonus}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LATE PENALTIES - TIERED */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <AlertTriangle size={24} />
                <div>
                  <h3 className="text-xl font-bold">Late Arrival Penalties</h3>
                  <p className="text-red-100 text-sm">Progressive tiered system</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.lateGracePeriodMinutes}
                  onChange={(e) => setSettings({
                    ...settings,
                    lateGracePeriodMinutes: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-semibold"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Info size={12} />
                  No penalty applied within this grace period
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-5 rounded-xl space-y-4 border-2 border-red-100">
                <div>
                  <label className="block text-sm font-bold text-red-900 mb-2">
                    Tier 1: After 30 min - 1 hour late
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-700 font-bold">₹</span>
                    <input
                      type="number"
                      value={settings.latePenalties.after30Minutes}
                      onChange={(e) => setSettings({
                        ...settings,
                        latePenalties: {
                          ...settings.latePenalties,
                          after30Minutes: parseInt(e.target.value) || 0
                        }
                      })}
                      className="flex-1 px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-red-900 mb-2">
                    Tier 2: After 1 hour - 1.5 hours late
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-700 font-bold">₹</span>
                    <input
                      type="number"
                      value={settings.latePenalties.after1Hour}
                      onChange={(e) => setSettings({
                        ...settings,
                        latePenalties: {
                          ...settings.latePenalties,
                          after1Hour: parseInt(e.target.value) || 0
                        }
                      })}
                      className="flex-1 px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-red-900 mb-2">
                    Tier 3: After 1.5+ hours late
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-700 font-bold">₹</span>
                    <input
                      type="number"
                      value={settings.latePenalties.after1AndHalfHours}
                      onChange={(e) => setSettings({
                        ...settings,
                        latePenalties: {
                          ...settings.latePenalties,
                          after1AndHalfHours: parseInt(e.target.value) || 0
                        }
                      })}
                      className="flex-1 px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OVERTIME BONUSES - TIERED */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <Award size={24} />
                <div>
                  <h3 className="text-xl font-bold">Overtime Bonuses</h3>
                  <p className="text-green-100 text-sm">Rewards for dedication</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl space-y-4 border-2 border-green-100">
                <div>
                  <label className="block text-sm font-bold text-green-900 mb-2">
                    Level 1: 1 hour overtime
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-700 font-bold">₹</span>
                    <input
                      type="number"
                      value={settings.overtimeBonuses.after1Hour}
                      onChange={(e) => setSettings({
                        ...settings,
                        overtimeBonuses: {
                          ...settings.overtimeBonuses,
                          after1Hour: parseInt(e.target.value) || 0
                        }
                      })}
                      className="flex-1 px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-green-900 mb-2">
                    Level 2: 2 hours overtime
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-700 font-bold">₹</span>
                    <input
                      type="number"
                      value={settings.overtimeBonuses.after2Hours}
                      onChange={(e) => setSettings({
                        ...settings,
                        overtimeBonuses: {
                          ...settings.overtimeBonuses,
                          after2Hours: parseInt(e.target.value) || 0
                        }
                      })}
                      className="flex-1 px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-green-900 mb-2">
                    Level 3: 3 hours overtime
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-700 font-bold">₹</span>
                    <input
                      type="number"
                      value={settings.overtimeBonuses.after3Hours}
                      onChange={(e) => setSettings({
                        ...settings,
                        overtimeBonuses: {
                          ...settings.overtimeBonuses,
                          after3Hours: parseInt(e.target.value) || 0
                        }
                      })}
                      className="flex-1 px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-green-900 mb-2">
                    Level 4: 4+ hours overtime
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-700 font-bold">₹</span>
                    <input
                      type="number"
                      value={settings.overtimeBonuses.after4Hours}
                      onChange={(e) => setSettings({
                        ...settings,
                        overtimeBonuses: {
                          ...settings.overtimeBonuses,
                          after4Hours: parseInt(e.target.value) || 0
                        }
                      })}
                      className="flex-1 px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EARLY EXIT */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <LogOut size={24} />
                <div>
                  <h3 className="text-xl font-bold">Early Exit Penalty</h3>
                  <p className="text-orange-100 text-sm">Leaving before shift ends</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.earlyExitGraceMinutes}
                  onChange={(e) => setSettings({
                    ...settings,
                    earlyExitGraceMinutes: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-semibold"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-2">No penalty within this period before shift end</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Penalty Per Minute (₹)
                </label>
                <input
                  type="number"
                  value={settings.earlyExitPenaltyPerMinute}
                  onChange={(e) => setSettings({
                    ...settings,
                    earlyExitPenaltyPerMinute: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-semibold"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Example: 30 min early = ₹{settings.earlyExitPenaltyPerMinute * 30} penalty
                </p>
              </div>
            </div>
          </div>

          {/* ABSENCE & SHIFT */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <Calendar size={24} />
                <div>
                  <h3 className="text-xl font-bold">Absence & Shift Rules</h3>
                  <p className="text-purple-100 text-sm">Full day and half day policies</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Day Absent Penalty (₹)
                </label>
                <input
                  type="number"
                  value={settings.absentFullDayPenalty}
                  onChange={(e) => setSettings({
                    ...settings,
                    absentFullDayPenalty: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Half Day Penalty (₹)
                </label>
                <input
                  type="number"
                  value={settings.halfDayPenalty}
                  onChange={(e) => setSettings({
                    ...settings,
                    halfDayPenalty: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Half Day Threshold (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.halfDayThresholdMinutes}
                  onChange={(e) => setSettings({
                    ...settings,
                    halfDayThresholdMinutes: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Work below {(settings.halfDayThresholdMinutes / 60).toFixed(1)} hours triggers half-day penalty
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Standard Shift Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.standardShiftMinutes}
                  onChange={(e) => setSettings({
                    ...settings,
                    standardShiftMinutes: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                  min="60"
                />
                <p className="text-xs text-gray-500 mt-2 font-semibold">
                  = {(settings.standardShiftMinutes / 60).toFixed(1)} hours per day
                </p>
              </div>
            </div>
          </div>

          {/* BREAK PENALTIES */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden lg:col-span-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <Coffee size={24} />
                <div>
                  <h3 className="text-xl font-bold">Break Time Management</h3>
                  <p className="text-blue-100 text-sm">Control excessive break penalties</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Maximum Break Time (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.maxBreakMinutes}
                    onChange={(e) => setSettings({
                      ...settings,
                      maxBreakMinutes: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                    = {(settings.maxBreakMinutes / 60).toFixed(1)} hours total break allowed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Excess Break Penalty Per Minute (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.excessBreakPenaltyPerMinute}
                    onChange={(e) => setSettings({
                      ...settings,
                      excessBreakPenaltyPerMinute: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Example: 30 min excess = ₹{settings.excessBreakPenaltyPerMinute * 30} penalty
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden lg:col-span-2">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <Info size={24} />
                <h3 className="text-xl font-bold">Additional Notes</h3>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={settings.notes}
                onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
                placeholder="Add any notes about policy changes, special considerations, or effective dates..."
              />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-8 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl border-2 border-indigo-300 p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <CheckCircle size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Quick Reference Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/70 rounded-xl p-4 shadow-md">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Late Grace</p>
                  <p className="text-2xl font-bold text-gray-900">{settings.lateGracePeriodMinutes}</p>
                  <p className="text-xs text-gray-500">minutes</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 shadow-md">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Max Late Penalty</p>
                  <p className="text-2xl font-bold text-red-600">₹{settings.latePenalties.after1AndHalfHours}</p>
                  <p className="text-xs text-gray-500">1.5h+ late</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 shadow-md">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Max OT Bonus</p>
                  <p className="text-2xl font-bold text-green-600">₹{settings.overtimeBonuses.after4Hours}</p>
                  <p className="text-xs text-gray-500">4+ hours</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 shadow-md">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Shift Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{settings.standardShiftMinutes / 60}</p>
                  <p className="text-xs text-gray-500">hours</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 shadow-md">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Break Limit</p>
                  <p className="text-2xl font-bold text-blue-600">{settings.maxBreakMinutes}</p>
                  <p className="text-xs text-gray-500">minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollSettings;