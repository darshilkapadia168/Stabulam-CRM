import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function Employment({ formData, setFormData, onNext, onPrev }) {
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);

  // ✅ Fetch all employees to populate the reporting manager dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoadingManagers(true);
        const response = await api.get('/employees');
        setManagers(response.data.employees || []);
      } catch (error) {
        console.error('Failed to fetch managers:', error);
      } finally {
        setLoadingManagers(false);
      }
    };

    fetchManagers();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      <h3 className="text-2xl font-semibold text-slate-800 mb-6">Employment Details</h3>
      
      <div className="grid grid-cols-2 gap-6">
        
        {/* Row 1: Employee Role - ✅ FIXED WITH BACKEND ENUM VALUES */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Employee Role/Level</label>
          <select 
            name="role" 
            value={formData.role} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            required
          >
            <option value="">Select Role Level</option>
            <option value="intern">Intern</option>
            <option value="jr_employee">Junior Employee</option>
            <option value="sr_employee">Senior Employee</option>
            <option value="team_leader">Team Leader</option>
            <option value="management">Management</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <p className="mt-1 text-[11px] text-slate-400 italic">
            This determines system access level and permissions
          </p>
        </div>

        {/* Row 2: Date of Join & Employment Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Join</label>
          <input 
            type="date" 
            name="joinDate" 
            value={formData.joinDate} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
          <select 
            name="employmentType" 
            value={formData.employmentType} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Select Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* 🕒 NEW: Start Time & End Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input 
            type="time" 
            name="startTime" 
            value={formData.startTime || ''} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
            required
          />
          <p className="mt-1 text-[11px] text-slate-400 italic">
            Daily work start time
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <input 
            type="time" 
            name="endTime" 
            value={formData.endTime || ''} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
            required
          />
          <p className="mt-1 text-[11px] text-slate-400 italic">
            Daily work end time
          </p>
        </div>

        {/* Row 3: Work Email & Work Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
          <input 
            type="email" 
            name="workEmail" 
            value={formData.workEmail} 
            onChange={handleChange} 
            placeholder="company@email.com" 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Work Location</label>
          <input 
            type="text" 
            name="workLocation" 
            value={formData.workLocation} 
            onChange={handleChange} 
            placeholder="e.g. Surat, India" 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        {/* Row 4: Department & Job Designation */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
          <select 
            name="department" 
            value={formData.department} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Select Department</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        {/* ✅ NEW: Job Designation Field (Frontend Dev, HR Manager, etc.) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Job Title/Designation</label>
          <input 
            type="text" 
            name="designation" 
            value={formData.designation || ''} 
            onChange={handleChange} 
            placeholder="e.g. Frontend Developer, HR Manager" 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
          <p className="mt-1 text-[11px] text-slate-400 italic">
            Specific job title (different from role level above)
          </p>
        </div>

        {/* ✅ FIXED: Reporting Manager - Now a Dropdown with Employee IDs */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reporting Manager (Optional)
          </label>
          <select 
            name="reportingManager" 
            value={formData.reportingManager} 
            onChange={handleChange} 
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            disabled={loadingManagers}
          >
            <option value="">
              {loadingManagers ? 'Loading managers...' : 'No Reporting Manager'}
            </option>
            {managers.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.userId?.name} - {emp.jobInfo?.designation || emp.jobInfo?.department || 'Employee'}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400 italic">
            Select the manager this employee will report to
          </p>
        </div>

        {/* Annual Salary */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Annual CTC (Salary)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
            <input 
              type="number" 
              name="salary" 
              value={formData.salary} 
              onChange={handleChange} 
              placeholder="e.g. 600000" 
              className="w-full border border-slate-300 rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400 italic">This information will be restricted to HR and Finance only.</p>
        </div>

      </div>

      {/* Navigation Buttons */}
      <div className="mt-10 flex justify-end gap-4">
        <button 
          onClick={onPrev} 
          className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          Back
        </button>
        <button 
          onClick={onNext} 
          className="px-10 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}