const ALLOWED_ROLES = Object.freeze(["OPERATOR", "ANALYST", "READ_ONLY"]);

function deny(res, code, message) {
    res.status(403).json({ error: message, code });
    return false;
}

function requireTenantRole(req, res, allowedRoles = []) {
    const role = req.tenantUser?.role;
    if (!role) {
        return deny(res, "TENANT_ROLE_MISSING", "Tenant user role missing. Re-authenticate.");
    }

    if (!ALLOWED_ROLES.includes(role)) {
        return deny(res, "TENANT_ROLE_UNKNOWN", "Unknown tenant role");
    }

    if (!allowedRoles.includes(role)) {
        return deny(res, "TENANT_ROLE_DENIED", "Insufficient tenant permissions");
    }

    return true;
}

module.exports = {
    requireTenantRole,
};
