import { useAuth } from "../context/AuthContext";
import { Shield, Mail, CheckCircle, User } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Avatar & Greeting color based on role
  const roleStyles = {
    admin: "from-red-500 to-red-600 text-red-600",
    management: "from-yellow-500 to-yellow-600 text-yellow-600",
    team_leader: "from-purple-500 to-purple-600 text-purple-600",
    sr_employee: "from-green-500 to-green-600 text-green-600",
    jr_employee: "from-indigo-500 to-indigo-600 text-indigo-600",
    intern: "from-blue-500 to-blue-600 text-blue-600",
    default: "from-gray-500 to-gray-600 text-gray-600",
  };

  const currentRoleStyle = roleStyles[user?.role?.toLowerCase()] || roleStyles.default;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className={`mt-1 font-medium ${currentRoleStyle}`}>
          👋 {getGreeting()}, {user?.name || "User"}!
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-1">Role</h3>
          <p className="text-2xl font-bold text-indigo-900 capitalize">{user?.role || "N/A"}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-1">Email</h3>
          <p className="text-lg font-semibold text-blue-900 truncate">{user?.email || "N/A"}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg shadow-lg shadow-green-500/30">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-green-600 uppercase tracking-wide mb-1">Status</h3>
          <p className="text-2xl font-bold text-green-900">Active</p>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-bold text-slate-900">Profile Information</h3>
        </div>

        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentRoleStyle} flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-indigo-100`}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <p className="text-2xl font-bold text-slate-900 mb-1">{user?.name || "Unknown"}</p>
            <p className="text-slate-600 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user?.email || "No email"}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full capitalize">
                {user?.role || "N/A"}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
