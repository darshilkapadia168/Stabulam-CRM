const ROLE_PERMISSIONS = {
    super_admin: {
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canChangeRole: true,
    },

    admin: {
        canEdit: true,
        canDelete: true,
        canApprove: false,
        canChangeRole: false,
    },

    team_leader: {
        canEdit: true,
        canDelete: false,
    },

    senior_employee: {
        canEdit: false,
        canDelete: false,
    },

    junior_employee: {
        canEdit: false,
        canDelete: false,
    },

    intern: {
        canEdit: false,
        canDelete: false,
    },
};

module.exports = ROLE_PERMISSIONS;
