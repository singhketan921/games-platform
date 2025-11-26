const prisma = require("../prisma/client");
const crypto = require("crypto");

exports.createTenant = async (req, res) => {
    try {
        const { name } = req.body;

        const apiKey = crypto.randomBytes(16).toString("hex");
        const apiSecret = crypto.randomBytes(32).toString("hex");

        const tenant = await prisma.tenant.create({
            data: {
                name,
                apiKey,
                apiSecret
            }
        });

        res.json({ success: true, tenant });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create tenant" });
    }
};
