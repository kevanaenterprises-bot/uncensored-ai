# Migration: Add @unique to Subscription.stripeSubscriptionId

Why
- We add a uniqueness constraint on stripeSubscriptionId to ensure upsert operations
  do not create duplicate subscription rows for the same Stripe subscription id.

Important
- This change requires a Prisma migration and that the database contains no duplicate
  stripeSubscriptionId values. If duplicates exist, the migration will fail.

Recommended safe process
1. Run a read-only duplicate check (locally or in CI):
   - node scripts/check-duplicate-subscriptions.js
   - If no duplicates found, proceed to step 3.

2. If duplicates exist, run the dedupe script against a staging DB snapshot:
   - node scripts/dedupe-subscriptions.js
   - Verify results and review any removed records in backups.

3. Generate and apply Prisma migration:
   - npx prisma migrate dev --name add-unique-stripeSubscriptionId
   - Commit the generated migration files and push.

4. Apply in production:
   - Ensure backups exist
   - npx prisma migrate deploy

Rollback notes
- If something goes wrong, restore from DB backup and investigate the duplicate rows.
