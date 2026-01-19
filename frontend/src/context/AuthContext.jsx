import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

const AuthContext = createContext();

const DEFAULT_PERMISSIONS = {
  dashboard: { view: false },
  usermanagement: { view: false, create: false, update: false, delete: false },
  employees: { view: false, create: false, edit: false, delete: false },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // 🔹 Socket.io setup
  useEffect(() => {
    if (user?.id) {
      // Connect socket when user is logged in
      const socket = connectSocket(user.id);

      // Listen for permission updates
      socket.on('permissions-updated', (data) => {
        console.log('🔔 Permissions updated from server:', data);
        
        // Update user permissions in context
        setUser((prev) => ({
          ...prev,
          permissions: data.permissions
        }));

        // Update localStorage
        const updatedUser = { ...user, permissions: data.permissions };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Show notification to user
        alert(data.message || 'Your permissions have been updated by an administrator. Changes are now active.');
      });

      return () => {
        socket.off('permissions-updated');
      };
    } else {
      // Disconnect socket when user logs out
      disconnectSocket();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const login = (data) => {
    if (!data?.token || !data?.user) {
      console.error("❌ Invalid login response:", data);
      alert("Login failed. Invalid server response.");
      return false;
    }

    if (data.user.status !== "active") {
      const statusMessages = {
        pending: "Your account is pending approval by Super Admin.",
        inactive: "Your account is inactive.",
        suspended: "Your account has been suspended.",
      };
      alert(statusMessages[data.user.status] || "Account not active.");
      return false;
    }

    const safeUser = {
      ...data.user,
      id: data.user._id || data.user.id,
      permissions: data.user.permissions || DEFAULT_PERMISSIONS,
    };

    console.log("✅ Logged in user:", safeUser);

    setUser(safeUser);
    setToken(data.token);
    return true;
  };

  const logout = () => {
    disconnectSocket(); // Disconnect socket on logout
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  const updateUser = (updatedUser) => {
    console.log("🔄 Updating user context:", updatedUser);

    setUser((prev) => {
      if (!prev) return prev;

      const mergedUser = {
        ...prev,
        ...updatedUser,
        id: updatedUser._id || updatedUser.id || prev.id,
        permissions: {
          dashboard: {
            ...(prev.permissions?.dashboard || {}),
            ...(updatedUser.permissions?.dashboard || {}),
          },
          usermanagement: {
            ...(prev.permissions?.usermanagement || {}),
            ...(updatedUser.permissions?.usermanagement || {}),
          },
          employees: {
            ...(prev.permissions?.employees || {}),
            ...(updatedUser.permissions?.employees || {}),
          },
        },
      };

      console.log("✅ User after update:", mergedUser);
      return mergedUser;
    });
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";

  const canViewDashboard = isSuperAdmin || isAdmin || user?.permissions?.dashboard?.view === true;

  const canViewUsers = isSuperAdmin || isAdmin || user?.permissions?.usermanagement?.view === true;
  const canCreateUsers = isSuperAdmin || isAdmin || user?.permissions?.usermanagement?.create === true;
  const canUpdateUsers = isSuperAdmin || isAdmin || user?.permissions?.usermanagement?.update === true;
  const canDeleteUsers = isSuperAdmin || isAdmin || user?.permissions?.usermanagement?.delete === true;

  const canViewEmployees = isSuperAdmin || isAdmin || user?.permissions?.employees?.view === true;
  const canCreateEmployees = isSuperAdmin || isAdmin || user?.permissions?.employees?.create === true;
  const canEditEmployees = isSuperAdmin || isAdmin || user?.permissions?.employees?.edit === true;
  const canDeleteEmployees = isSuperAdmin || isAdmin || user?.permissions?.employees?.delete === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAdmin,
        isSuperAdmin,
        canViewDashboard,
        canViewUsers,
        canCreateUsers,
        canUpdateUsers,
        canDeleteUsers,
        canViewEmployees,
        canCreateEmployees,
        canEditEmployees,
        canDeleteEmployees,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);