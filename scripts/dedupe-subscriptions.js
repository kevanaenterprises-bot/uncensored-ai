// scripts/dedupe-subscriptions.js
// Usage: node scripts/dedupe-subscriptions.js
// Make sure DATABASE_URL is set (or use .env) and run against a non-production snapshot first.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Scanning for duplicate stripeSubscriptionId entries...');
  const duplicates = await prisma.$queryRawUnsafe(`
    SELECT "stripeSubscriptionId", COUNT(*) AS cnt, array_agg(id) AS ids
    FROM "Subscription"
    WHERE stripeSubscriptionId IS NOT NULL
    GROUP BY "stripeSubscriptionId"
    HAVING COUNT(*) > 1;
  `);

  if (!duplicates || duplicates.length === 0) {
    console.log('No duplicates found. Safe to migrate.');
    return;
  }

  for (const row of duplicates) {
    const stripeId = row.stripeSubscriptionId;
    const ids = row.ids; // array of ids
    console.log(`Found duplicate stripeSubscriptionId=${stripeId} -> ids=${ids}`);

    const subs = await prisma.subscription.findMany({
      where: { id: { in: ids } },
      orderBy: { currentPeriodEnd: 'desc' }, // prefer latest period
    });

    const canonical = subs[0];
    const toRemove = subs.slice(1);

    // Merge strategy: keep canonical, set used = max(used), quota = max(quota)
    const mergedUsed = Math.max(...subs.map(s => s.used || 0));
    const mergedQuota = Math.max(...subs.map(s => s.quota || 0));

    await prisma.subscription.update({
      where: { id: canonical.id },
      data: {
        used: mergedUsed,
        quota: mergedQuota,
      },
    });

    for (const rem of toRemove) {
      console.log(`Deleting duplicate subscription id=${rem.id}`);
      await prisma.subscription.delete({ where: { id: rem.id } });
    }
  }

  console.log('Dedupe complete. Re-run duplicate check to confirm.');
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
