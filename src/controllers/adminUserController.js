const adminUserService = require("../services/adminUserService");

exports.list = async (_req, res) => {
    try {
        const users = await adminUserService.listAdminUsers();
        res.json({ success: true, users });
    } catch (err) {
        console.error("Failed to load admin users:", err);
        res.status(500).json({ error: "Failed to load admin users" });
    }
};

exports.create = async (req, res) => {
    try {
        const { email, password, role = "ADMIN" } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const normalizedRole = role.toUpperCase();
        const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ANALYST", "READ_ONLY"];
        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const admin = await adminUserService.createAdminUser({
            email: email.toLowerCase(),
            password,
            role: normalizedRole,
        });

        res.status(201).json({ success: true, user: admin });
    } catch (err) {
        if (err.code === "P2002") {
            return res.status(409).json({ error: "Email already exists" });
        }

        console.error("Failed to create admin user:", err);
        res.status(500).json({ error: "Failed to create admin user" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status, password } = req.body || {};

        if (!id) {
            return res.status(400).json({ error: "Missing admin user id" });
        }

        if (!role && !status && !password) {
            return res.status(400).json({ error: "No updates provided" });
        }

        let normalizedRole;
        if (role) {
            normalizedRole = role.toUpperCase();
            const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ANALYST", "READ_ONLY"];
            if (!allowedRoles.includes(normalizedRole)) {
                return res.status(400).json({ error: "Invalid role" });
            }
        }

        const updated = await adminUserService.updateAdminUser(id, {
            role: normalizedRole,
            status,
            password,
        });

        res.json({ success: true, user: updated });
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Admin user not found" });
        }

        console.error("Failed to update admin user:", err);
        res.status(500).json({ error: "Failed to update admin user" });
    }
};
