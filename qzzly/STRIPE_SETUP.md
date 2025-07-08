# Stripe Integration Setup Guide

This guide will help you set up Stripe payments with Supabase for your Quiz.io application.

## Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Supabase Project**: Already set up with the schema applied
3. **Environment Variables**: Configured in your `.env` file

## Step 1: Configure Stripe

### 1.1 Get Your Stripe Keys

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > API keys**
3. Copy your **Publishable key** and **Secret key**
4. Add them to your `.env` file:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 1.2 Create Products and Prices

1. Go to **Products** in your Stripe Dashboard
2. Create the following products:

#### Pro Plan
- **Name**: Quiz.io Pro
- **Price**: $9.99/month
- **Price ID**: `price_pro_monthly`

#### Premium Plan
- **Name**: Quiz.io Premium
- **Price**: $19.99/month
- **Price ID**: `price_premium_monthly`

### 1.3 Configure Webhooks

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and add to your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 2: Environment Configuration

Update your `.env` file with all required variables:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

## Step 3: API Endpoints Setup

### 3.1 Create API Routes

You'll need to create these API endpoints in your backend:

#### `/api/stripe/create-checkout-session`
```typescript
import { createCheckoutSession } from './stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;
    const result = await createCheckoutSession({
      priceId,
      userId,
      successUrl,
      cancelUrl,
    });
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### `/api/stripe/create-portal-session`
```typescript
import { createPortalSession } from './stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, returnUrl } = req.body;
    const result = await createPortalSession({
      userId,
      returnUrl,
    });
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### `/api/stripe/webhook`
```typescript
import { handleWebhook } from './stripe';
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
  });

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    await handleWebhook(event);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
}
```

## Step 4: Testing

### 4.1 Test Cards

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### 4.2 Test the Flow

1. Start your development server
2. Go to the pricing page
3. Click "Get Started" on a paid plan
4. Complete the checkout with a test card
5. Verify the subscription is created in Supabase

## Step 5: Production Deployment

### 5.1 Update Environment Variables

1. Switch to live Stripe keys
2. Update webhook endpoint URL
3. Configure production domain

### 5.2 Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Error Handling**: Implement proper error handling
3. **Logging**: Add comprehensive logging for debugging
4. **Rate Limiting**: Implement rate limiting on API endpoints

## Troubleshooting

### Common Issues

1. **Webhook Failures**: Check webhook endpoint URL and secret
2. **Customer Not Found**: Verify customer creation logic
3. **Subscription Sync**: Ensure Supabase is updated on webhook events

### Debug Tips

1. Check Stripe Dashboard logs
2. Monitor Supabase database changes
3. Use Stripe CLI for local webhook testing

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure webhook endpoints are accessible
4. Test with Stripe's test mode first 