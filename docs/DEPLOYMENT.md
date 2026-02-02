# Deployment Guide

This guide covers multiple deployment options for the uncensored-ai application.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [GitHub Container Registry (GHCR)](#github-container-registry-ghcr)
3. [Railway Deployment](#railway-deployment)
4. [Environment Variables](#environment-variables)
5. [Production Checklist](#production-checklist)

---

## Docker Deployment

### Prerequisites

- Docker installed on your system
- Docker Compose (optional, for local development)

### Building the Docker Image

```bash
# Build the production image
npm run docker:build

# Or build manually
docker build -t uncensored-ai .
```

### Running with Docker

```bash
# Run the container with required environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:port/database" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e OPENAI_API_KEY="sk-..." \
  -e STRIPE_SECRET_KEY="sk_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..." \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="secure-password" \
  --name uncensored-ai \
  uncensored-ai
```

### Running Database Migrations

Before starting the application, run Prisma migrations:

```bash
# Inside the container
docker exec uncensored-ai npx prisma migrate deploy

# Or run as a separate container
docker run --rm \
  -e DATABASE_URL="postgresql://user:password@host:port/database" \
  uncensored-ai \
  npx prisma migrate deploy
```

### Docker Compose (Development)

For local development with all services:

```bash
# Start all services (PostgreSQL, Redis, App)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## GitHub Container Registry (GHCR)

The application is automatically built and published to GHCR on every push to `main` and on tagged releases.

### Pulling from GHCR

```bash
# Pull the latest image
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:latest

# Pull a specific version
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:v1.2.3

# Pull by commit SHA
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:main-abc1234
```

### Running from GHCR

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e OPENAI_API_KEY="..." \
  -e STRIPE_SECRET_KEY="..." \
  -e STRIPE_WEBHOOK_SECRET="..." \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..." \
  -e ADMIN_EMAIL="..." \
  -e ADMIN_PASSWORD="..." \
  --name uncensored-ai \
  ghcr.io/kevanaenterprises-bot/uncensored-ai:latest
```

### CI/CD with GHCR

The GitHub Actions workflows automatically:

1. **On Pull Requests**: Run tests, linting, and build checks
2. **On Push to Main**: Build and push Docker images to GHCR with `latest` tag
3. **On Tagged Releases**: Build and push with version tags (e.g., `v1.2.3`)

#### Triggering a Release

To create a new release, use semantic versioning with conventional commits:

```bash
# Create a feature (minor version bump)
git commit -m "feat: add new AI model support"

# Create a fix (patch version bump)
git commit -m "fix: resolve authentication bug"

# Create a breaking change (major version bump)
git commit -m "feat!: redesign API endpoints

BREAKING CHANGE: API endpoints have been restructured"

# Push to main (triggers automatic release)
git push origin main
```

The release workflow will:
- Analyze commit messages
- Determine version bump (major, minor, patch)
- Generate changelog
- Create GitHub Release
- Update package.json version
- Tag the release

### Repository Setup (No Secrets Required!)

GHCR publishing uses `GITHUB_TOKEN` which is automatically provided. No additional secrets are needed!

**Optional: For other registries**

If you want to publish to Docker Hub or other registries:

1. Go to **Settings → Secrets and variables → Actions**
2. Add repository secrets:
   - `DOCKERHUB_USERNAME` - Your Docker Hub username
   - `DOCKERHUB_TOKEN` - Docker Hub access token
3. Update `.github/workflows/publish-ghcr.yml` to include Docker Hub

---

## Railway Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Stripe Account**: Set up at [stripe.com](https://stripe.com)
3. **OpenAI API Key**: Obtain from [platform.openai.com](https://platform.openai.com)
4. **PostgreSQL Database**: Railway provides this automatically

---

## Environment Variables

### Required for All Deployments

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

### Docker Build Issues
- Ensure all environment variables are set during build
- Check that Prisma schema is valid: `npx prisma validate`
- Verify Node.js version compatibility (18+)

### GHCR Authentication Issues
- GHCR uses `GITHUB_TOKEN` automatically in GitHub Actions
- For local pulls of private images: `docker login ghcr.io -u USERNAME`
- Use a Personal Access Token with `read:packages` scope

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

- **Database**: Upgrade PostgreSQL plan as needed (Railway, AWS RDS, etc.)
- **Container Orchestration**: Deploy to Kubernetes, ECS, or Docker Swarm for horizontal scaling
- **API Rate Limits**: Implement Redis-based rate limiting
- **OpenAI Costs**: Monitor usage and set billing alerts
- **Caching**: Add Redis for session storage and caching
- **Load Balancing**: Use nginx or cloud load balancer for multiple container instances
- **CDN**: Use Cloudflare or AWS CloudFront for static assets

---

## Production Checklist

Before deploying to production:

- [ ] All environment variables are set and secure
- [ ] Database migrations have been run (`npx prisma migrate deploy`)
- [ ] Stripe webhook endpoint is configured and verified
- [ ] Admin account has been created
- [ ] NEXTAUTH_SECRET is strong and randomly generated
- [ ] HTTPS is enabled (automatic with Railway, configure for Docker)
- [ ] Database backups are configured
- [ ] Monitoring and logging are set up
- [ ] Rate limiting is enabled (optional)
- [ ] Health check endpoint is responding (`/api/health`)
- [ ] Container resource limits are appropriate
- [ ] CI/CD workflows are passing

---

## Vercel Deployment (Alternative)

If you prefer serverless deployment:

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Configure Environment Variables** in Vercel Dashboard

3. **Deploy**:
   ```bash
   vercel --prod
   ```

**Note**: Vercel has limitations with Prisma and long-running processes. Docker/Railway is recommended for this application.

---

## Support

For deployment issues:
- Check GitHub Actions logs for CI/CD failures
- Review container logs: `docker logs uncensored-ai`
- Consult [GitHub Issues](https://github.com/kevanaenterprises-bot/uncensored-ai/issues)

