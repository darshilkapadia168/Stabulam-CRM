import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import UserForm from "../components/UserForm";

import {
  CheckCircle,
  Users as UsersIcon,
  History as HistoryIcon,
  Edit2,
  Trash2,
  Search,
  UserPlus,
  XCircle,
  Eye,
  Clock,
  Ban,
  Shield
} from "lucide-react";

export default function UserManagement() {
  const {
    user,
    token,
    updateUser,

    // ✅ PERMISSION HELPERS FROM AUTH CONTEXT
    canShowUsers,
    canViewUsers,
    canCreateUsers,
    canUpdateUsers,
    canDeleteUsers,
    isSuperAdmin,
  } = useAuth();
  const [historyUser, setHistoryUser] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ UPDATED PERMISSION STATE - Matches backend structure
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [permissionUser, setPermissionUser] = useState(null);
  const [permissions, setPermissions] = useState({
    dashboard: { view: false },
    usermanagement: { 
      showusers: false, 
      view: false, 
      create: false, 
      update: false, 
      delete: false 
    },
    employees: {
    view: false,
    create: false,
    edit: false,
    delete: false
  }
  });

  const API_URL = import.meta.env.VITE_API_URL;

  /* =========================
      FETCH USERS
  ========================= */
  const fetchUsers = async () => {
    try {
      const res = await fetch(API_URL + "/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);

      // Update logged-in user info if it exists in list
      const updatedSelf = data.find((u) => u._id === user?.id);
      if (updatedSelf) {
        updateUser(updatedSelf);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setUsers([]);
    }
  };

  /* =========================
      DELETE USER
  ========================= */
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  /* =========================
      ✅ UPDATE USER STATUS
  ========================= */
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update status");
        return;
      }

      alert(data.message || "Status updated successfully");
      fetchUsers();
    } catch (err) {
      console.error("Update status error:", err);
      alert("Failed to update status");
    }
  };

  /* =========================
      ✅ UPDATED PERMISSION LOGIC
  ========================= */
const openPermissionModal = (targetUser) => {
    setPermissionUser(targetUser);
    const userPermissions = targetUser.permissions || {};
    setPermissions({
      dashboard: userPermissions.dashboard || { view: false },
      usermanagement: userPermissions.usermanagement || { 
        showusers: false, 
        view: false, 
        create: false, 
        update: false, 
        delete: false 
      },
      employees: userPermissions.employees || {
      view: false,
      create: false,
      edit: false,
      delete: false
    }
    });
    setPermissionModalOpen(true);
  };

const handlePermissionChange = (module, action) => {
  setPermissions((prev) => {
    const updated = {
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    };

    // 🔹 If current user is editing their own permissions, update context immediately
    if (permissionUser?._id === user._id) {
      updateUser({ permissions: updated });
    }

    return updated;
  });
};


const handleQuickAction = (module, type) => {
  const value = type === "all";
  
  if (module === "usermanagement") {
    setPermissions((prev) => ({
      ...prev,
      usermanagement: {
        view: value,
        create: value,
        update: value,
        delete: value,
      },
    }));
  } else if (module === "employees") {
    setPermissions((prev) => ({
      ...prev,
      employees: {
        view: value,
        create: value,
        edit: value,
        delete: value,
      },
    }));
  } else if (module === "dashboard") {
    setPermissions((prev) => ({
      ...prev,
      dashboard: {
        view: value,
      },
    }));
  }
};

  /* =========================
      ✅ FIXED SAVE PERMISSIONS
  ========================= */
const savePermissions = async () => {
  console.log("🔹 Permissions state before saving:", permissions);
  console.log("🔹 User being edited:", permissionUser.name);
  
  try {
    const res = await fetch(
      `${API_URL}/api/users/${permissionUser._id}/permissions`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      }
    );

    const data = await res.json();
    console.log("🔹 Server response:", data);

    if (!res.ok) {
      alert(data.message || "Failed to update permissions");
      return;
    }

    setPermissionModalOpen(false);

    await fetchUsers(); // refresh user list

    // 🔹 Update current logged-in user if they edited their own permissions
    if (permissionUser._id === user._id) {
      updateUser({ permissions }); // merge new permissions into context
      alert("Your permissions have been updated.");
    } else {
      alert(data.message || "Permissions updated successfully");
    }
  } catch (err) {
    console.error("Save permissions error:", err);
    alert("Failed to save permissions");
  }
};


// Get icon and color for history action type
  const getHistoryIcon = (actionType) => {
    switch (actionType) {
      case 'created':
        return { Icon: UserPlus, bgColor: 'bg-green-100', iconColor: 'text-green-600' };
      case 'updated':
        return { Icon: Edit2, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' };
      case 'permission_changed':
        return { Icon: Shield, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' };
      case 'status_changed':
        return { Icon: CheckCircle, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' };
      case 'deleted':
        return { Icon: Trash2, bgColor: 'bg-red-100', iconColor: 'text-red-600' };
      default:
        return { Icon: HistoryIcon, bgColor: 'bg-slate-100', iconColor: 'text-slate-600' };
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  // Open history modal and fetch user history
  const openHistoryModal = async (u) => {
  
  setHistoryUser(u);
  setHistoryModalOpen(true);
  setLoadingHistory(true);
  
  try {
    const url = `${API_URL}/api/users/${u._id}/history`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    
    if (data.success) {
      setHistoryData(data.history);
    } else {
      console.error("❌ Failed to fetch history:", data.message);
      setHistoryData([]);
    }
  } catch (err) {
    console.error("❌ Error fetching history:", err);
    setHistoryData([]);
  } finally {
    setLoadingHistory(false);
  }
};


  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (user && !canViewUsers) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <UsersIcon className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-500 mt-2">
            You don't have permission to view users.
          </p>
          <p className="text-xs text-slate-400 mt-4">
            Current role: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
    );
  }

  /* =========================
      STATUS BADGE COMPONENT
  ========================= */
  const StatusBadge = ({ status, userId, isSuperAdmin, isOwnAccount }) => {
    const statusConfig = {
      pending: {
        icon: <Clock className="w-3.5 h-3.5" />,
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Pending",
      },
      active: {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        className: "bg-green-100 text-green-700 border-green-200",
        label: "Active",
      },
      inactive: {
        icon: <XCircle className="w-3.5 h-3.5" />,
        className: "bg-gray-100 text-gray-700 border-gray-200",
        label: "Inactive",
      },
      suspended: {
        icon: <Ban className="w-3.5 h-3.5" />,
        className: "bg-red-100 text-red-700 border-red-200",
        label: "Suspended",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    if (isSuperAdmin && !isOwnAccount) {
      return (
        <select
          value={status}
          onChange={(e) => updateUserStatus(userId, e.target.value)}
          className={`inline-flex items-cente py-1 rounded-full text-xs font-medium border 
                      ${config.className} cursor-pointer hover:opacity-80 transition-all`}
        >
          <option value="pending">⏳ Pending</option>
          <option value="active">✅ Active</option>
          <option value="inactive">❌ Inactive</option>
          <option value="suspended">🚫 Suspended</option>
        </select>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  

  return (
    <>
      <div className={`${open || permissionModalOpen ? "blur-sm pointer-events-none" : ""} space-y-6`}>
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-indigo-600" />
              User Management
            </h2>
            <p className="text-slate-600 mt-1">Manage and monitor all system users</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* SEARCH BAR */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg w-full sm:w-64
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* ADD USER BUTTON */}
            {canCreateUsers && (
              <button
                onClick={() => {
                  setEditUser(null);
                  setOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 
                           text-white px-4 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 
                           transition-all font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
              >
                <UserPlus className="w-5 h-5" />
                Add User
              </button>
            )}
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Created
                  </th>
                  {(user?.role === "admin" || user?.role === "super_admin") && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(canViewUsers || canUpdateUsers || canDeleteUsers || isSuperAdmin)  ? 7 : 6}
                      className="px-6 py-12 text-center"
                    >
                      <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No users found</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your search</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{i + 1}</td>

                      {/* NAME WITH AVATAR */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 
                                            flex items-center justify-center text-white font-semibold shadow-md">
                            {u.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{u.name}</span>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>

                      {/* ROLE BADGE */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize
                          ${
                            u.role === "super_admin"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : u.role === "admin"
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={u.status || "pending"}
                          userId={u._id}
                          isSuperAdmin={user?.role === "super_admin"}
                          isOwnAccount={user?._id === u._id}
                        />
                      </td>

                      {/* CREATED DATE */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* ACTIONS COLUMN - FIXED AND CLEANED */}
                      {(canShowUsers || canViewUsers || canUpdateUsers || canDeleteUsers || isSuperAdmin) && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* VIEW */}
                            {canViewUsers && (
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="View User"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {/* HISTORY */}
                            {(user?.role === "super_admin" || user?.role === "admin") && (
                              <button
                                onClick={() => openHistoryModal(u)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View History"
                              >
                                <HistoryIcon className="w-4 h-4" />
                              </button>
                            )}

                            {/* PERMISSION (SUPER ADMIN ONLY) */}
                            {isSuperAdmin && (
                              <button
                                onClick={() => openPermissionModal(u)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Manage Permissions"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}

                            {/* EDIT */}
                            {canUpdateUsers && (
                              <button
                                onClick={() => {
                                  setEditUser(u);
                                  setOpen(true);
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit User"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* DELETE */}
                            {canDeleteUsers && (
                              <button
                                onClick={() => deleteUser(u._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredUsers.length}</span> of{" "}
                <span className="font-semibold text-slate-900">{users.length}</span> users
              </p>
            </div>
          )}
        </div>
      </div>

      {/* USER FORM MODAL */}
      {open && (
        <UserForm
          editUser={editUser}
          refresh={fetchUsers}
          closeForm={() => {
            setOpen(false);
            setEditUser(null);
          }}
        />
      )}

      {/* ✅ UPDATED PERMISSION MODAL - Matches backend structure */}
      {permissionModalOpen && permissionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setPermissionModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Permission Management</h3>
                <p className="text-sm text-slate-500">Managing access for <span className="font-semibold text-indigo-600">{permissionUser.name}</span></p>
              </div>
              <button 
                onClick={() => setPermissionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                      <th className="px-4 py-3">Module Name</th>
                      <th className="px-4 py-3 text-center">View</th>
                      <th className="px-4 py-3 text-center">Create</th>
                      <th className="px-4 py-3 text-center">Update</th>
                      <th className="px-4 py-3 text-center">Delete</th>
                      <th className="px-4 py-3 text-center w-32">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">

                    {/* Dashboard Row */}
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 capitalize">Dashboard</td>
                      <td colSpan="4" className="px-4 py-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded-full focus:ring-indigo-500 transition-all cursor-pointer"
                            checked={permissions.dashboard?.view || false}
                            onChange={() => handlePermissionChange("dashboard", "view")} 
                          />
                        </label>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleQuickAction("dashboard", "all")} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium">All</button>
                          <button onClick={() => handleQuickAction("dashboard", "none")} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 font-medium">None</button>
                        </div>
                      </td>
                    </tr>

                    {/* User Management Row */}
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 capitalize">User Management</td>
                      {["view", "create", "update", "delete"].map((action) => (
                        <td key={action} className="px-4 py-3 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 text-indigo-600 border-gray-300 rounded-full focus:ring-indigo-500 transition-all cursor-pointer"
                              checked={permissions.usermanagement?.[action] || false}
                              onChange={() => handlePermissionChange("usermanagement", action)} 
                            />
                          </label>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleQuickAction("usermanagement", "all")} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium">All</button>
                          <button onClick={() => handleQuickAction("usermanagement", "none")} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 font-medium">None</button>
                        </div>
                      </td>
                    </tr>

                    {/* Employee Management Row */}
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 capitalize">Employee Management</td>
                      {["view", "create", "edit", "delete"].map((action) => (
                        <td key={action} className="px-4 py-3 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 text-indigo-600 border-gray-300 rounded-full focus:ring-indigo-500 transition-all cursor-pointer"
                              checked={permissions.employees?.[action] || false}
                              onChange={() => handlePermissionChange("employees", action)} 
                            />
                          </label>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button 
                            onClick={() => handleQuickAction("employees", "all")} 
                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                          >
                            All
                          </button>
                          <button 
                            onClick={() => handleQuickAction("employees", "none")} 
                            className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 font-medium"
                          >
                            None
                          </button>
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setPermissionModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={savePermissions} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW USER MODAL (Existing) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-indigo-900/60 to-slate-900/80 backdrop-blur-xl"
            onClick={() => setSelectedUser(null)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-slate-200/50">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* HEADER */}
            <div className="relative px-6 py-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">User Profile</h3>
                  <p className="text-xs text-slate-500 mt-0.5">User information and status</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="h-8 w-8 rounded-full bg-slate-200/50 hover:bg-slate-300/70 
                             flex items-center justify-center transition-all duration-200
                             hover:scale-110 active:scale-95"
                >
                  <span className="text-slate-600 text-lg">×</span>
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-6">
              <div className="space-y-3">
                {/* NAME */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-transparent 
                                border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                      Full Name
                    </label>
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedUser.name}</p>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-transparent 
                                border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                      Email Address
                    </label>
                    <p className="text-sm font-semibold text-slate-700 truncate">{selectedUser.email}</p>
                  </div>
                </div>

                {/* ROLE */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-transparent 
                                border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      User Role
                    </label>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold
                                      bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md">
                      {selectedUser.role.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* STATUS */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-transparent 
                                border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                    selectedUser.status === "active" ? "bg-emerald-100" :
                    selectedUser.status === "pending" ? "bg-amber-100" :
                    selectedUser.status === "suspended" ? "bg-red-100" : "bg-gray-100"
                  }`}>
                    <svg className={`w-4 h-4 ${
                      selectedUser.status === "active" ? "text-emerald-600" :
                      selectedUser.status === "pending" ? "text-amber-600" :
                      selectedUser.status === "suspended" ? "text-red-600" : "text-gray-600"
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {selectedUser.status === "active" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Account Status
                    </label>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-md ${
                      selectedUser.status === "active" ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" :
                      selectedUser.status === "pending" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white" :
                      selectedUser.status === "suspended" ? "bg-gradient-to-r from-red-500 to-red-600 text-white" :
                      "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                    }`}>
                      {selectedUser.status === "active" && <span>✓</span>}
                      {selectedUser.status === "pending" && <span>⏳</span>}
                      {selectedUser.status === "suspended" && <span>🚫</span>}
                      {selectedUser.status === "inactive" && <span>❌</span>}
                      {(selectedUser.status || "pending").charAt(0).toUpperCase() + (selectedUser.status || "pending").slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-3 bg-gradient-to-br from-slate-50 to-slate-100/50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white 
                           text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-800
                           active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <span>Close</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================
    ADD THIS HISTORY MODAL AFTER YOUR PERMISSION MODAL
============================================ */}

      {/* HISTORY MODAL - PERFORMANCE OPTIMIZED */}
      {/* HISTORY MODAL - PERFORMANCE OPTIMIZED */}
      {historyModalOpen && historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setHistoryModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Activity History</h3>
                <p className="text-sm text-slate-500">
                  Viewing history for <span className="font-semibold text-blue-600">{historyUser.name}</span>
                </p>
              </div>
              <button 
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Body - Optimized Scrolling */}
            <div 
              className="p-6 flex-1 overflow-y-scroll overscroll-contain"
              style={{
                scrollBehavior: 'smooth',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                perspective: 1000
              }}
            >
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="ml-3 text-slate-500">Loading history...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12">
                  <HistoryIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No activity history found</p>
                  <p className="text-slate-400 text-sm mt-1">Changes will appear here once actions are performed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData
                    .filter(item => item.actionType !== 'permission_changed')  // ✅ Filter out permission changes
                    .map((item) => {
                    const { Icon, bgColor, iconColor } = getHistoryIcon(item.actionType);
                    
                    return (
                      <div 
                        key={item._id} 
                        className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                        style={{ transform: 'translateZ(0)' }}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${iconColor}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800 capitalize">
                                {item.actionType.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-slate-600 mt-1">
                                {item.changes?.description || 'Action performed'}
                              </p>
                              
                              {/* Show old vs new values - Simplified */}
                              {item.changes?.oldValue && item.changes?.newValue && item.changes?.field !== 'password' && (
                                <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-xs space-y-1">
                                  <div className="flex gap-2">
                                    <span className="text-slate-500">Before:</span>
                                    <span className="font-mono text-red-600 line-through">
                                      {typeof item.changes.oldValue === 'object' 
                                        ? JSON.stringify(item.changes.oldValue).substring(0, 100) 
                                        : String(item.changes.oldValue).substring(0, 100)}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-slate-500">After:</span>
                                    <span className="font-mono text-green-600 font-medium">
                                      {typeof item.changes.newValue === 'object' 
                                        ? JSON.stringify(item.changes.newValue).substring(0, 100)
                                        : String(item.changes.newValue).substring(0, 100)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <span>By {item.performedByName || 'System'}</span>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-600">
                                  {item.performedByRole || 'system'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <p className="text-center text-slate-400 text-sm py-4">
                    End of history
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setHistoryModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}