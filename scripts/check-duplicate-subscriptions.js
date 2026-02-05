scripts/check-duplicate-subscriptions.js
v5
// scripts/check-duplicate-subscriptions.js
// Exit code 0 => no duplicates; non-zero => duplicates found.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

