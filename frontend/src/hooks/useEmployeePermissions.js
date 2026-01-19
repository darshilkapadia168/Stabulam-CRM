// hooks/useEmployeePermissions.js
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for Employee Management permissions
 * Similar to User Management permission checks
 */
export const useEmployeePermissions = () => {
    const { user } = useAuth();

    // Super Admin and Admin have full access
    const isSuperAdmin = user?.role === 'super_admin';
    const isAdmin = user?.role === 'admin';
    const isPrivileged = isSuperAdmin || isAdmin;

    // Check individual permissions for employees module
    const canViewEmployees = isPrivileged || user?.permissions?.employees?.view === true;
    const canCreateEmployees = isPrivileged || user?.permissions?.employees?.create === true;
    const canEditEmployees = isPrivileged || user?.permissions?.employees?.edit === true;
    const canDeleteEmployees = isPrivileged || user?.permissions?.employees?.delete === true;

    // Helper function to check any permission
    const hasEmployeePermission = (action) => {
        if (isPrivileged) return true;
        return user?.permissions?.employees?.[action] === true;
    };

    return {
        // Role checks
        isSuperAdmin,
        isAdmin,
        isPrivileged,

        // Permission checks
        canViewEmployees,
        canCreateEmployees,
        canEditEmployees,
        canDeleteEmployees,

        // Helper function
        hasEmployeePermission,

        // User object
        user
    };
};

export default useEmployeePermissions;