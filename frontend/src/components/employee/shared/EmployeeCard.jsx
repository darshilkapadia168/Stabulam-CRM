import React, { useState } from "react";
import { Eye, Edit3, Trash2, X, Mail, Briefcase, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useEmployeePermissions from "../../../hooks/useEmployeePermissions";
import api from "../../../services/api";

export default function EmployeeCard({ employee, onDelete }) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔹 GET PERMISSIONS
  const { canEditEmployees, canDeleteEmployees } = useEmployeePermissions();

  const name = employee.userId?.name || "Unknown";
  const email = employee.userId?.email || "N/A";
  const avatar = employee.userId?.avatar || null;
  const role = employee.jobInfo?.designation || "Unassigned";
  const department = employee.jobInfo?.department || "Unassigned";
  const employeeId = employee._id;
  const userId = employee.userId?._id;
  
  const startTime = employee.jobInfo?.startTime || "09:00";
  const endTime = employee.jobInfo?.endTime || "18:00";

  const formatTime = (time) => {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/dashboard/employees/edit/${employeeId}`);
  };

  const openModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const openDeleteModal = (e) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userId || !employeeId) {
      alert("Invalid employee data");
      return;
    }

    setIsDeleting(true);

    try {
      await api.delete(`/employees/${employeeId}`);
      await api.delete(`/users/${userId}`);

      alert("Employee deleted successfully!");
      setIsDeleteModalOpen(false);
      
      if (onDelete) {
        onDelete(employeeId);
      }
    } catch (error) {
      console.error("Delete error:", error);
      
      // 🔹 Handle 403 permission error
      if (error.response?.status === 403) {
        alert("You don't have permission to delete employees");
      } else {
        alert(error.response?.data?.message || "Failed to delete employee");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* THE CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 pt-8 flex flex-col items-center text-center group relative">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-slate-50 shadow-sm">
          <img 
            src={avatar || `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="px-4 mb-6">
          <h3 className="text-base font-bold text-slate-800">{name}</h3>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{role}</p>
        </div>

        <div className="w-full border-t border-slate-50 mt-auto flex divide-x divide-slate-50">
          {/* 🔹 VIEW - Always visible if user can access employee list */}
          <button 
            onClick={openModal} 
            className="flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
          >
            <Eye size={14} /> View
          </button>

          {/* 🔹 EDIT - Only show if user has edit permission */}
          {canEditEmployees && (
            <button 
              onClick={handleEdit}
              className="flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition-all"
            >
              <Edit3 size={14} /> Edit
            </button>
          )}

          {/* 🔹 DELETE - Only show if user has delete permission */}
          {canDeleteEmployees && (
            <button 
              onClick={openDeleteModal}
              className="flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* QUICK VIEW MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="h-22 w-full relative flex items-center justify-center">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-8 pb-10 pt-2 -mt-14 flex flex-col items-center text-center">
              
              <div className="w-32 h-32 rounded-full overflow-hidden border-[6px] border-white shadow-xl mb-4 bg-white">
                <img 
                  src={avatar || `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`} 
                  className="w-full h-full object-cover"
                  alt={name}
                />
              </div>
              
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
                {name}
              </h2>

              <p className="text-indigo-600 text-sm font-bold mb-8 uppercase tracking-widest">
                {role}
              </p>

              <div className="w-full space-y-3 mb-8">
                
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Briefcase size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-400">
                      Department
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    {department}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Mail size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-400">
                      Email
                    </span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 break-all">
                    {email}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Clock size={16} className="text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-400">
                      Work Hours
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-700 block">
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Daily Shift
                    </span>
                  </div>
                </div>

              </div>

              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  navigate(`/dashboard/employees/${employeeId}`);
                }}
                className="w-full py-4 bg-[#0f172a] text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 uppercase tracking-wider"
              >
                View Full Profile
              </button>

            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 text-center mb-3">
                Delete Employee?
              </h3>

              <p className="text-slate-600 text-center mb-2">
                Are you sure you want to delete <span className="font-bold text-slate-900">{name}</span>?
              </p>
              <p className="text-sm text-red-600 text-center mb-8">
                This action will permanently delete both the employee profile and user account. This cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}