import { supabase } from '../lib/supabase';

export interface CreateCheckoutSessionData {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePortalSessionData {
  returnUrl: string;
}

export interface SubscriptionStatus {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: 'free' | 'pro' | 'premium';
  currentPeriodEnd: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export class StripeService {
  static async createCheckoutSession(data: CreateCheckoutSessionData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: data.priceId,
          userId: user.id,
          successUrl: data.successUrl,
          cancelUrl: data.cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      return { sessionId, error: null };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { sessionId: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async createPortalSession(data: CreatePortalSessionData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: data.returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      return { url, error: null };
    } catch (error) {
      console.error('Error creating portal session:', error);
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getSubscriptionStatus(): Promise<{ subscription: SubscriptionStatus | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { subscription: null, error: 'User not authenticated' };
      }

      // First try to get from Supabase
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching subscription from Supabase:', error);
        return { subscription: null, error: error.message };
      }

      if (subscription) {
        return {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodEnd: subscription.current_period_end,
            stripeCustomerId: subscription.stripe_customer_id,
            stripeSubscriptionId: subscription.stripe_subscription_id,
          },
          error: null
        };
      }

      // If no subscription in Supabase, return free plan
      return {
        subscription: {
          id: 'free',
          status: 'active',
          plan: 'free',
          currentPeriodEnd: new Date().toISOString(),
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { 
        subscription: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async handleWebhook(event: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private static async handleCheckoutCompleted(session: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: session.customer,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        plan: this.getPlanFromPriceId(session.line_items?.data?.[0]?.price?.id),
        status: 'active',
        current_period_start: new Date(session.subscription_data?.subscription?.current_period_start * 1000).toISOString(),
        current_period_end: new Date(session.subscription_data?.subscription?.current_period_end * 1000).toISOString(),
      });

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  private static async handleSubscriptionUpdated(subscription: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  private static async handleSubscriptionDeleted(subscription: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  private static getPlanFromPriceId(priceId: string): 'free' | 'pro' | 'premium' {
    // Map your Stripe price IDs to plans
    const planMap: Record<string, 'free' | 'pro' | 'premium'> = {
      'price_pro_monthly': 'pro',
      'price_pro_yearly': 'pro',
      'price_premium_monthly': 'premium',
      'price_premium_yearly': 'premium',
    };
    return planMap[priceId] || 'free';
  }
} 