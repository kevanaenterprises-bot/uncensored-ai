# Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Stripe Account**: Set up at [stripe.com](https://stripe.com)
3. **OpenAI API Key**: Obtain from [platform.openai.com](https://platform.openai.com)
4. **PostgreSQL Database**: Railway provides this automatically

## Environment Variables

Set the following environment variables in Railway:

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### NextAuth
```
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.railway.app
```

### OpenAI
```
OPENAI_API_KEY=sk-...
```

### Stripe
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Admin Account
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>
```

### Optional: Redis
```
REDIS_URL=redis://...
```

## Stripe Setup

### 1. Create Products and Prices

In your Stripe Dashboard, create products for each tier:

**Basic Tier:**
- Product: "Basic Plan"
- Price: $9.99/month
- Copy the Price ID (e.g., `price_1234...`)

**Pro Tier:**
- Product: "Pro Plan"
- Price: $29.99/month
- Copy the Price ID

**Premium Tier:**
- Product: "Premium Plan"
- Price: $99.99/month
- Copy the Price ID

### 2. Update Price IDs

Edit `pages/api/stripe/webhook.ts` and update the `getQuotaForPrice` and `getTierForPrice` functions with your actual Stripe Price IDs:

```typescript
function getQuotaForPrice(priceId?: string): number {
  const quotaMap: Record<string, number> = {
    'price_YOUR_BASIC_ID': 10000,
    'price_YOUR_PRO_ID': 50000,
    'price_YOUR_PREMIUM_ID': 200000,
  };
  return quotaMap[priceId || ''] || 10000;
}

function getTierForPrice(priceId?: string): string {
  const tierMap: Record<string, string> = {
    'price_YOUR_BASIC_ID': 'basic',
    'price_YOUR_PRO_ID': 'pro',
    'price_YOUR_PREMIUM_ID': 'premium',
  };
  return tierMap[priceId || ''] || 'basic';
}
```

### 3. Configure Webhook

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-app.railway.app/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Copy the webhook signing secret and add it to your environment variables

## Deployment Steps

### 1. Connect Repository to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link

# Deploy
railway up
```

### 2. Initialize Database

After deployment, run Prisma migrations:

```bash
# Generate Prisma client
railway run npx prisma generate

# Run migrations
railway run npx prisma migrate deploy
```

### 3. Create Admin Account

Use the `/api/admin/create-admin` endpoint (implementation required) or manually insert into database:

```sql
INSERT INTO "User" (id, email, "emailVerified", "passwordHash", "isAdmin", "createdAt")
VALUES (
  'admin_id',
  'admin@example.com',
  NOW(),
  '<bcrypt-hash-of-password>',
  true,
  NOW()
);
```

Generate bcrypt hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

## Post-Deployment

### 1. Test Authentication
- Visit `/api/auth/signin`
- Login with admin credentials

### 2. Test Stripe Integration
- Create a test subscription
- Verify webhook receives events
- Check database for subscription records

### 3. Test AI Assistant
- Authenticate a user
- Send POST to `/api/assistant` with a prompt
- Verify quota is tracked correctly

## Monitoring

### Check Logs
```bash
railway logs
```

### Database Access
```bash
railway connect
```

## Security Checklist

- ✅ All secrets in environment variables (not in code)
- ✅ Stripe webhook signature verification enabled
- ✅ NextAuth secret is strong and random
- ✅ Admin password is secure
- ✅ HTTPS enabled (automatic with Railway)
- ✅ Database credentials are secure
- ✅ CORS properly configured (if needed)

## Troubleshooting

### Stripe Webhooks Not Working
- Verify webhook URL is correct and publicly accessible
- Check webhook signing secret matches environment variable
- Review Railway logs for errors

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if migrations have been run
- Ensure Prisma client is generated

### Authentication Failures
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure user exists in database with correct password hash

## Scaling Considerations

- **Database**: Upgrade Railway PostgreSQL plan as needed
- **API Rate Limits**: Implement Redis-based rate limiting
- **OpenAI Costs**: Monitor usage and set billing alerts
- **Caching**: Add Redis for session storage and caching
