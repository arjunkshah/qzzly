import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here'

export const stripePromise = loadStripe(stripePublishableKey)

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: '', // No price ID for free plan
    features: [
      '3 study sessions per month',
      'Basic AI features',
      'PDF upload support'
    ]
  },
  PRO: {
    name: 'Pro',
    price: 9.99,
    priceId: 'price_1234567890', // Replace with your Stripe price ID
    features: [
      'Unlimited study sessions',
      'Advanced AI features',
      'Priority support',
      'Export functionality'
    ]
  },
  PREMIUM: {
    name: 'Premium',
    price: 19.99,
    priceId: 'price_0987654321', // Replace with your Stripe price ID
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Advanced analytics',
      'Custom branding'
    ]
  }
} 