import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Shield, X } from "lucide-react";

export default function UserForm({ closeForm, refresh, editUser }) {
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "intern",
  });

  // Populate form when editing a user
  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name || "",
        email: editUser.email || "",
        password: "",
        confirmPassword: "",
        role: editUser.role || "intern",
      });
    }
  }, [editUser]);

  const roleOptions = () => {
    if (user?.role === "super_admin") {
      return ["admin", "management", "team_leader", "sr_employee", "jr_employee", "intern"];
    } else if (user?.role === "admin") {
      return ["management", "team_leader", "sr_employee", "jr_employee", "intern"];
    }
    return [];
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare payload
    let payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };

    // Include password only if set
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      if (formData.password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
      payload.password = formData.password;
    }

    try {
      if (editUser) {
        // UPDATE USER
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${editUser._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Update failed");
          return;
        }

        alert("User updated successfully!");
      } else {
        // CREATE USER
        if (!formData.password || formData.password.length < 6) {
          alert("Password must be at least 6 characters");
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...payload,
            password: formData.password,
            isApproved: user?.role === "super_admin",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Creation failed");
          return;
        }

        alert("User created successfully!");
      }

      refresh();
      closeForm();
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            {editUser ? "Edit User" : "Add New User"}
          </h3>
          <button
            type="button"
            onClick={closeForm}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {editUser && "(leave blank to keep current)"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Role */}
          {roleOptions().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all text-slate-900 bg-white appearance-none cursor-pointer"
                >
                  {roleOptions().map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={closeForm}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg
              hover:bg-slate-100 transition-all font-medium shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg
              hover:from-indigo-700 hover:to-indigo-800 transition-all font-medium shadow-lg
              shadow-indigo-500/30 hover:shadow-indigo-500/50"
          >
            {editUser ? "Update User" : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
