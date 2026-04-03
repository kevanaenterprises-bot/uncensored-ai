# Deployment Guide

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [GitHub Container Registry (GHCR)](#github-container-registry-ghcr)
3. [Railway Deployment](#railway-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Stripe Setup](#stripe-setup)
7. [Troubleshooting](#troubleshooting)

## Docker Deployment

### Local Docker Build

Build and run the application locally with Docker:

```bash
# Build the Docker image
npm run docker:build

# Or manually
docker build -t uncensored-ai .

# Run the container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e OPENAI_API_KEY="your-openai-key" \
  -e STRIPE_SECRET_KEY="your-stripe-key" \
  -e STRIPE_WEBHOOK_SECRET="your-webhook-secret" \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-publishable-key" \
  --name uncensored-ai \
  uncensored-ai
```

### Production Docker Deployment

The multi-stage Dockerfile is optimized for production:

- Uses Node.js 18 Alpine for smaller image size
- Separates build dependencies from runtime dependencies
- Runs as non-root user for security
- Includes Prisma client generation
- Optimized caching layers

## GitHub Container Registry (GHCR)

### Automatic Publishing

Docker images are automatically built and pushed to GHCR when:

1. **On push to main branch**: Creates image tagged with `latest` and commit SHA
2. **On version tags**: Creates image tagged with version number (e.g., `v1.0.0`)

No manual configuration or secrets are required! The workflow uses `GITHUB_TOKEN` automatically.

### Pull and Run from GHCR

```bash
# Pull the latest image
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:latest

# Run the image
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e OPENAI_API_KEY="your-openai-key" \
  -e STRIPE_SECRET_KEY="your-stripe-key" \
  -e STRIPE_WEBHOOK_SECRET="your-webhook-secret" \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-publishable-key" \
  --name uncensored-ai \
  ghcr.io/kevanaenterprises-bot/uncensored-ai:latest
```

### GitHub Package Permissions

To allow public access to your packages:

1. Go to your repository on GitHub
2. Navigate to **Settings > Actions > General**
3. Under "Workflow permissions", ensure **Read and write permissions** is selected
4. Under **Package settings**, set visibility to public if desired

### Using Specific Versions

```bash
# Pull a specific version
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:v1.0.0

# Pull by commit SHA
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:main-abc1234
```

## Railway Deployment

## Railway Deployment

### Prerequisites

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

## Database Migrations

### Running Migrations in Production

After deploying your application, you need to run database migrations:

#### With Docker

```bash
# Run migrations in a running container
docker exec uncensored-ai npx prisma migrate deploy

# Or run migrations before starting the app
docker run --rm \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  ghcr.io/kevanaenterprises-bot/uncensored-ai:latest \
  npx prisma migrate deploy
```

#### With Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Run migrations
railway run npx prisma migrate deploy
```

#### Manual Migration

If you have direct database access, you can also apply migrations manually:

```bash
# Generate Prisma Client (automatically done in postinstall)
npx prisma generate

# Apply all pending migrations
npx prisma migrate deploy
```

### Verifying Migrations

Check migration status:

```bash
npx prisma migrate status
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

### Option 1: Deploy with Docker from GHCR

This is the recommended approach for production deployments.

1. **Pull the image from GHCR:**
   ```bash
   docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:latest
   ```

2. **Run the container with environment variables:**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e NEXTAUTH_SECRET="your-secret" \
     -e NEXTAUTH_URL="https://your-domain.com" \
     -e OPENAI_API_KEY="your-key" \
     -e STRIPE_SECRET_KEY="your-key" \
     -e STRIPE_WEBHOOK_SECRET="your-secret" \
     -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-key" \
     --name uncensored-ai \
     ghcr.io/kevanaenterprises-bot/uncensored-ai:latest
   ```

3. **Run database migrations:**
   ```bash
   docker exec uncensored-ai npx prisma migrate deploy
   ```

### Option 2: Deploy to Railway

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

## Continuous Integration and Deployment

### Automated Workflows

The repository includes three GitHub Actions workflows:

1. **CI Workflow** (`.github/workflows/ci.yml`):
   - Runs on all pull requests and pushes to main
   - Executes linting, testing, and builds
   - Uses Node.js 18
   - Caches dependencies for faster runs
   - Fails fast on any errors

2. **GHCR Publishing** (`.github/workflows/publish-ghcr.yml`):
   - Automatically builds and pushes Docker images to GitHub Container Registry
   - Triggers on pushes to main branch and version tags
   - Creates multi-architecture images (amd64, arm64)
   - Tags images with: `latest`, commit SHA, and version tags
   - Uses `GITHUB_TOKEN` (no manual secret configuration needed)

3. **Automatic Releases** (`.github/workflows/release.yml`):
   - Runs after CI tests pass on main branch
   - Uses semantic-release to analyze commits
   - Automatically determines version bump (major, minor, patch)
   - Creates GitHub releases with changelog
   - Updates package.json version

### Triggering Releases

The release workflow uses **conventional commits** to determine version bumps:

- `feat:` - Minor version bump (new features)
- `fix:` - Patch version bump (bug fixes)
- `BREAKING CHANGE:` - Major version bump

Example commit messages:
```bash
git commit -m "feat: add new API endpoint"  # Triggers minor version bump
git commit -m "fix: resolve login issue"    # Triggers patch version bump
git commit -m "feat!: redesign API\n\nBREAKING CHANGE: API endpoints restructured"  # Major bump
```

### Manual Release

To manually trigger a release:

1. Ensure your commits follow conventional commit format
2. Push to main branch:
   ```bash
   git push origin main
   ```
3. The release workflow will automatically:
   - Run tests
   - Determine version bump
   - Create GitHub release
   - Update CHANGELOG.md
   - Trigger Docker image build with version tag

### Viewing CI Status

Check the **Actions** tab in your GitHub repository to view:
- Build status
- Test results
- Deployment logs
- Release history

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
