import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function createCheckoutSession(data: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    // Get or create customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: data.userId, // Using userId as email for demo
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: data.userId,
        metadata: {
          supabase_user_id: data.userId,
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: data.userId,
        },
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createPortalSession(data: {
  userId: string;
  returnUrl: string;
}) {
  try {
    // Find customer by Supabase user ID
    const customers = await stripe.customers.list({
      limit: 100,
    });
    
    // Filter by metadata after fetching
    const customerWithMetadata = customers.data.find(customer => 
      customer.metadata?.supabase_user_id === data.userId
    );
    
    if (!customerWithMetadata) {
      throw new Error('Customer not found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerWithMetadata.id,
      return_url: data.returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

export async function getSubscriptionStatus(userId: string) {
  try {
    // Find customer by Supabase user ID
    const customers = await stripe.customers.list({
      limit: 100,
    });
    
    const customerWithMetadata = customers.data.find(customer => 
      customer.metadata?.supabase_user_id === userId
    );

    if (!customerWithMetadata) {
      return { status: 'no_customer' };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerWithMetadata.id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return { status: 'no_subscription' };
    }

    const subscription = subscriptions.data[0];
    return {
      status: subscription.status,
      plan: getPlanFromPriceId(subscription.items.data[0]?.price.id),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
      stripeCustomerId: customerWithMetadata.id,
      stripeSubscriptionId: subscription.id,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
}

function getPlanFromPriceId(priceId: string): 'free' | 'pro' | 'premium' {
  const planMap: Record<string, 'free' | 'pro' | 'premium'> = {
    'price_pro_monthly': 'pro',
    'price_pro_yearly': 'pro',
    'price_premium_monthly': 'premium',
    'price_premium_yearly': 'premium',
  };
  return planMap[priceId] || 'free';
}

export async function handleWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // This would typically update your database
  console.log('Checkout completed:', session.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // This would typically update your database
  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // This would typically update your database
  console.log('Subscription deleted:', subscription.id);
} 