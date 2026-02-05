// scripts/dedupe-subscriptions.js
// Usage: node scripts/dedupe-subscriptions.js
// Make sure DATABASE_URL is set (or use .env) and run against a non-production snapshot first.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
