# API Documentation

## Authentication

### POST /api/auth/signin
Authenticate a user with email and password credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "isAdmin": false
  }
}
```

## AI Assistant

### POST /api/assistant
Generate AI responses using Venice.ai or OpenAI with quota enforcement.

**Supported Providers:**
- Venice.ai (default) - Privacy-focused uncensored AI models (Llama 3.3 70B, etc.)
- OpenAI - GPT-3.5 Turbo and other OpenAI models

Configure the provider using the `AI_PROVIDER` environment variable.

**Headers:**
- `Authorization`: NextAuth session cookie required

**Request Body:**
```json
{
  "prompt": "Your question or prompt here",
  "maxTokens": 1000
}
```

**Response (Success):**
```json
{
  "response": "AI generated response",
  "tokensUsed": 150,
  "remaining": 850,
  "provider": "venice",
  "model": "llama-3.3-70b"
}
```

> **Note**: The response now includes `provider` and `model` fields to indicate which AI service generated the response. These fields were added in the Venice.ai integration update.

**Response (Quota Exceeded):**
```json
{
  "error": "Insufficient quota. Remaining: 50, Required: 1000",
  "remaining": 50
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request
- `401`: Unauthorized (no session)
- `403`: Forbidden (quota exceeded)
- `500`: Server error

## Stripe Integration

### POST /api/stripe/create-checkout-session
Create a Stripe Checkout session for subscription purchase.

**Headers:**
- `Authorization`: NextAuth session cookie required

**Request Body:**
```json
{
  "tier": "basic"
}
```

**Supported Tiers:**
- `basic`: 10,000 tokens/month
- `pro`: 50,000 tokens/month
- `premium`: 200,000 tokens/month

**Response (Success):**
```json
{
  "sessionId": "cs_test_123...",
  "url": "https://checkout.stripe.com/pay/cs_test_123..."
}
```

**Response (Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (Invalid Tier):**
```json
{
  "error": "Invalid tier. Must be one of: basic, pro, premium"
}
```

**Status Codes:**
- `200`: Checkout session created successfully
- `400`: Invalid request or Stripe error
- `401`: Unauthorized (no session)
- `405`: Method not allowed (only POST)
- `500`: Server error

### POST /api/stripe/webhook
Handle Stripe webhook events for subscription management.

**Headers:**
- `stripe-signature`: Required for webhook verification

**Supported Events:**
- `checkout.session.completed`: Links user to Stripe customer
- `customer.subscription.created`: Creates new subscription record
- `customer.subscription.updated`: Updates subscription status/period
- `customer.subscription.deleted`: Marks subscription as canceled
- `invoice.payment_succeeded`: Resets usage quota for new billing period

**Response:**
```json
{
  "received": true
}
```

## Admin Endpoints

### POST /api/admin/create-admin
Create an initial admin user using credentials from environment variables.

**Request Body:**
None - uses ADMIN_EMAIL and ADMIN_PASSWORD from environment variables.

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "id": "cuid123",
    "email": "admin@example.com",
    "isAdmin": true,
    "createdAt": "2026-02-11T18:00:00.000Z"
  }
}
```

**Response (Already Exists):**
```json
{
  "error": "Admin user already exists",
  "email": "admin@example.com"
}
```

**Status Codes:**
- `201`: Admin created successfully
- `400`: Missing environment variables
- `405`: Method not allowed (only POST)
- `409`: Admin already exists
- `500`: Server error

### POST /api/admin/override
Allows admins to override subscription quotas and periods.

**Headers:**
- `Authorization`: Admin session required

**Request Body:**
```json
{
  "userId": "user_123",
  "action": "increase_quota",
  "value": 10000
}
```

**Actions:**
- `increase_quota`: Add tokens to quota (requires `value`)
- `reset_quota`: Reset used tokens to 0
- `extend_period`: Extend subscription period (requires `periodDays`)

**Response:**
```json
{
  "success": true,
  "subscription": { /* updated subscription */ },
  "message": "Successfully applied increase_quota for user user_123"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request
- `403`: Forbidden (not admin)
- `404`: Subscription not found
- `500`: Server error

## Billing Quota System

The quota system enforces token limits based on subscription tiers:

### Quota Check Flow
1. User makes API request
2. System retrieves active subscription
3. System checks:
   - Subscription exists and is active
   - Current period hasn't ended
   - Remaining quota >= tokens required
4. If allowed, processes request and updates usage
5. Logs usage in `UsageLog` table

### Subscription Tiers (Default)
- **Basic**: 10,000 tokens/month
- **Pro**: 50,000 tokens/month
- **Premium**: 200,000 tokens/month

### Quota Reset
Quotas automatically reset to 0 used tokens when:
- Stripe invoice payment succeeds (new billing period)
- Admin manually resets via override endpoint
