import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut } from "lucide-react";

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // ✅ Check if user is logged in and approved
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (!user.isApproved) {
      alert("Your account is not approved by Super Admin yet.");
      logout();
      navigate("/login");
    }
  }, [user, navigate, logout]);

  if (!user) {
    return null; // prevent layout render before redirect
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Sidebar with transition - Full Height */}
      <div
        className={`${
          isSidebarOpen ? "w-64" : "w-0"
        } h-full transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div>
              <h2 className="font-bold text-lg text-slate-900">
                👋Welcome back, {user?.name || "Guest"}!
              </h2>
              <p className="text-sm text-slate-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white 
                       px-4 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 
                       transition-all font-medium shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
