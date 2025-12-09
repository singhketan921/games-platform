function hasScope(req, requiredScope) {
    if (!requiredScope) return true;
    const auth = req.auth;
    if (!auth || auth.method !== "oauth") {
        return true;
    }
    const scopeList = Array.isArray(auth.scope) ? auth.scope : [];
    if (scopeList.includes("*")) {
        return true;
    }
    return scopeList.includes(requiredScope);
}

function enforceScope(req, res, requiredScope) {
    if (!hasScope(req, requiredScope)) {
        res.status(403).json({
            error: "OAUTH_SCOPE_DENIED",
            scope: requiredScope,
        });
        return false;
    }
    return true;
}

module.exports = {
    hasScope,
    enforceScope,
};
