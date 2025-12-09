#!/usr/bin/env node
require("dotenv").config();

const readline = require("node:readline");
const tenantUserService = require("../src/services/tenantUserService");
const prisma = require("../src/prisma/client");

async function promptHidden(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return await new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
        rl.output.write("\x1B[2K\x1B[200D");
    });
}

async function main() {
    const [, , tenantId, emailArg, passwordArg, roleArg] = process.argv;

    if (!tenantId || !emailArg) {
        console.error("Usage: node scripts/createTenantUser.js <tenantId> <email> [password] [role]");
        process.exit(1);
    }

    let password = passwordArg;
    if (!password) {
        password = await promptHidden("Password: ");
        if (!password) {
            console.error("Password is required");
            process.exit(1);
        }
    }

    const role = roleArg || "OPERATOR";

    try {
        const user = await tenantUserService.createTenantUser({
            tenantId,
            email: emailArg,
            password,
            role,
        });
        console.log(`Created tenant user ${user.email} (${user.role}) for tenant ${tenantId}`);
    } catch (err) {
        console.error("Failed to create tenant user:", err.message);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();
