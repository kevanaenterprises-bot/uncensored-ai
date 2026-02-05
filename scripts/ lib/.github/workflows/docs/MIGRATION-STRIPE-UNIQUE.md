Nice — two files left plus the webhook edit. Do each step the same way as before. After you commit each file, reply “done” and I’ll tell you the next step.

Step 5 — add the GitHub Actions workflow
1. Add file → Create new file
2. Name: .github/workflows/premerge-duplicate-check.yml
3. Paste the block below into the editor and Commit directly to branch: fix/schema-and-webhook-safety.

```yaml
name: Pre-merge duplicate stripeSubscriptionId check

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    branches: [main]

jobs:
  check-duplicates:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run duplicate check
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: node scripts/check-duplicate-subscriptions.js
```

Commit and reply “done”.

Step 6 — add the migration docs
1. Add file → Create new file
2. Name: docs/MIGRATION-STRIPE-UNIQUE.md
3. Paste the block below into the editor and Commit directly to branch: fix/schema-and-webhook-safety.

````markdown
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
````

Commit and reply “done”.

Step 7 — edit pages/api/stripe/webhook.ts
1. In the repo file list, open pages/api/stripe/webhook.ts (make sure branch fix/schema-and-webhook-safety is selected).
2. Click the pencil icon to edit the file.
3. Add this import near the top with other imports (adjust path if your code has a different relative location; from pages/api/stripe it should be ../../../lib/stripeHelpers):

```typescript
import { getSubscriptionCurrentPeriodEnd, getInvoiceSubscriptionId } from '../../../lib/stripeHelpers';
```

4. Replace any direct uses of subscription.current_period_end (or subscription.currentPeriodEnd) with these two lines (search for current_period_end or currentPeriodEnd):

```typescript
const currentPeriodEndUnix = getSubscriptionCurrentPeriodEnd(subscription);
const currentPeriodEndDate = currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : null;
```

Then when creating/updating DB records use currentPeriodEndDate (or fallback) instead of the previous direct unix value. Example create/upsert snippet:

```typescript
await prisma.subscription.upsert({
  where: { stripeSubscriptionId: subscription.id },
  create: {
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    tier,
    quota,
    used: 0,
    status: subscription.status,
    currentPeriodEnd: currentPeriodEndDate,
  },
  update: {
    tier,
    quota,
    status: subscription.status,
    currentPeriodEnd: currentPeriodEndDate,
  },
});
```

5. Replace any direct invoice.subscription usage with:

```typescript
const subscriptionId = getInvoiceSubscriptionId(invoice);
if (!subscriptionId) {
  // invoice does not reference a subscription — handle or early return
}
```

6. Commit changes to branch: fix/schema-and-webhook-safety (commit message: use stripeHelpers to normalize webhook fields).

If you prefer, I can produce a full replacement of pages/api/stripe/webhook.ts here and you can overwrite the file — say “full webhook replace” and I’ll output the full file text to paste.

After you commit the webhook edits, reply “done” and I’ll guide you to open the PR and run the quick checks.
