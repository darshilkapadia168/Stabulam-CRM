import React from 'react';
import { useLocation } from 'react-router-dom';
import EmployeeForm from '../components/employee/EmployeeForm';
import ProfileDashboard from '../components/employee/ProfileDashboard';
import { Users, UserPlus } from 'lucide-react';

export default function EmployeePage() {
  const location = useLocation();
  
  // Determine if we are in "Create" mode or "Profile View" mode based on URL
  const isCreateMode = location.pathname.includes('create');

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            {isCreateMode ? <UserPlus size={24} /> : <Users size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isCreateMode ? 'Employee Registration' : 'Employee Directory'}
            </h1>
            <p className="text-slate-500 text-sm">
              {isCreateMode 
                ? 'Fill in the details below to onboard a new team member.' 
                : 'View and manage existing employee profiles and documents.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {isCreateMode ? (
          <EmployeeForm />
        ) : (
          <ProfileDashboard />
        )}
      </div>
      
      {/* Footer Helper */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <p className="text-xs text-slate-400">
          © 2025 Admin Management System • Internal HR Tool
        </p>
      </div>
    </div>
  );
}