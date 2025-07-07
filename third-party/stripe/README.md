# Stripe Integration

This folder contains the Stripe integration logic for Qzzly.com.

- `stripeClient.ts`: Exports a configured Stripe client using the secret key from environment variables. Use this in your backend or integration code to interact with the Stripe API.
- `stripeIntegration.ts`: Example integration code for handling payments, subscriptions, or webhooks.

**Note:** Do not commit your Stripe secret keys to version control. Use environment variables for all secrets.
