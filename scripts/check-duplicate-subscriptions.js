// scripts/check-duplicate-subscriptions.js
// Exit code 0 => no duplicates; non-zero => duplicates found.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dup = await prisma.$queryRaw`
    SELECT "stripeSubscriptionId", COUNT(*) AS cnt
    FROM "Subscription"
    WHERE stripeSubscriptionId IS NOT NULL
    GROUP BY "stripeSubscriptionId"
    HAVING COUNT(*) > 1
    LIMIT 1;
  `;
  if (dup && dup.length > 0) {
    console.error('Duplicate stripeSubscriptionId entries detected. Please run scripts/dedupe-subscriptions.js first.');
    process.exit(2);
  }
  console.log('No duplicate stripeSubscriptionId entries found.');
  process.exit(0);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
