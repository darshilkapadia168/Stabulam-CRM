// Admin roles
export const ADMIN_ROLES = ['admin', 'super_admin'];

// Employee roles
export const EMPLOYEE_ROLES = ['employee', 'sr_employee', 'jr_employee', 'intern'];

// All roles
export const ALL_ROLES = [...ADMIN_ROLES, ...EMPLOYEE_ROLES];

// Check if user is admin
export const isAdmin = (role) => ADMIN_ROLES.includes(role);

// Check if user is employee
export const isEmployee = (role) => EMPLOYEE_ROLES.includes(role);

// Get role display name
export const getRoleDisplayName = (role) => {
    const roleNames = {
        'super_admin': 'Super Admin',
        'admin': 'Admin',
        'employee': 'Employee',
        'sr_employee': 'Senior Employee',
        'jr_employee': 'Junior Employee',
        'intern': 'Intern'
    };
    return roleNames[role] || role;
};