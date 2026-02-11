# Next.js Full-Stack Application

This is a full-stack Next.js application with TypeScript, Tailwind CSS, authentication, subscription billing, and AI integration.

## Features

- 🔐 **Authentication**: Secure email/password authentication with NextAuth.js
- 💳 **Subscription Billing**: Stripe integration with multiple tiers
- 🤖 **AI Integration**: Support for both OpenAI and Venice.ai with quota management
- 📊 **Usage Tracking**: Track token usage and enforce billing quotas
- 👥 **Admin Panel**: Admin tools for quota overrides and user management
- 🗄️ **Database**: PostgreSQL with Prisma ORM
- 🔒 **Security**: Bcrypt password hashing, webhook verification, JWT sessions

## Documentation

- [Installation Guide](docs/INSTALLATION.md) - **Step-by-step dependency installation**
- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [API Documentation](docs/API.md) - Detailed API endpoint reference
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions

## Quick Start

> 📖 **New to this project?** See the [Installation Guide](docs/INSTALLATION.md) for detailed, step-by-step instructions for installing all dependencies.

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Stripe account (for billing)
- AI Provider API key (Venice.ai or OpenAI)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd uncensored-ai
   npm install
   ```
   
   💡 **Having trouble?** Check the [Installation Guide](docs/INSTALLATION.md) for platform-specific instructions and troubleshooting.

2. **Start local services:**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## Environment Variables

### Core Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Application URL
- `REDIS_URL`: Redis connection string (optional)
- `ADMIN_EMAIL`: Admin email
- `ADMIN_PASSWORD`: Admin password

### AI Provider Configuration
- `AI_PROVIDER`: AI provider to use (`venice` or `openai`, default: `venice`)
- `VENICE_API_KEY`: Venice.ai API key (required if using Venice.ai)
- `VENICE_MODEL`: Venice.ai model name (default: `llama-3.3-70b`)
- `OPENAI_API_KEY`: OpenAI API key (required if using OpenAI)

### Stripe Configuration
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

## AI Provider Configuration

This application supports two AI providers: **Venice.ai** (default) and **OpenAI**.

### Using Venice.ai (Recommended)

Venice.ai provides privacy-focused, uncensored AI models including Llama 3.3 70B and other open-source models.

1. Get your API key from [Venice.ai Settings](https://venice.ai/settings/api)
2. Set environment variables:
   ```bash
   AI_PROVIDER=venice
   VENICE_API_KEY=your-venice-api-key
   VENICE_MODEL=llama-3.3-70b  # Optional, this is the default
   ```

**Available Venice.ai Models:**
- `llama-3.3-70b` (default)
- `llama-3.2-3b`
- `hermes-3-llama-3.1-405b`
- And more - check [Venice.ai documentation](https://docs.venice.ai)

### Using OpenAI

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set environment variables:
   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

The application will automatically route requests to the configured provider.

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **AI**: Venice.ai (default) or OpenAI API
- **Testing**: Jest
- **Linting**: ESLint

## Project Structure

```
uncensored-ai/
├── docs/              # Documentation
├── lib/               # Utility modules (quota, database)
├── pages/             # Next.js pages and API routes
│   ├── api/           # API endpoints
│   │   ├── admin/     # Admin endpoints
│   │   ├── auth/      # Authentication
│   │   ├── stripe/    # Stripe webhooks
│   │   └── assistant.ts # AI assistant
│   └── admin/         # Admin pages
├── prisma/            # Database schema
├── tests/             # Test files
└── types/             # TypeScript declarations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Deployment

Deploy to Railway or any Node.js hosting platform. See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

## Security

- Passwords are hashed with bcrypt
- API keys and secrets stored in environment variables
- Stripe webhooks verified with signing secrets
- NextAuth JWT sessions with secure secrets
- Admin-only endpoints protected with role checks

## License

Private - All rights reserved

## Support

For issues and questions, please open an issue in the repository.
