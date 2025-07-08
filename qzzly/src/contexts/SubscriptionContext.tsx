import React, { createContext, useContext, useEffect, useState } from 'react';
import { StripeService } from '@/services/stripeService';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: 'free' | 'pro' | 'premium';
  currentPeriodEnd: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  createCheckoutSession: (priceId: string) => Promise<void>;
  createPortalSession: () => Promise<void>;
  getSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const getSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const status = await StripeService.getSubscriptionStatus();
      
      if (status.status === 'active' && status.subscription) {
        setSubscription({
          id: status.subscription.id,
          status: status.subscription.status,
          plan: status.subscription.plan,
          currentPeriodEnd: status.subscription.current_period_end,
        });
      } else {
        setSubscription({
          id: 'free',
          status: 'active',
          plan: 'free',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        });
      }
    } catch (error) {
      console.error('Error getting subscription status:', error);
      setSubscription({
        id: 'free',
        status: 'active',
        plan: 'free',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      await StripeService.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const createPortalSession = async () => {
    try {
      await StripeService.createPortalSession({
        returnUrl: `${window.location.origin}/dashboard`,
      });
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  };

  useEffect(() => {
    getSubscriptionStatus();
  }, []);

  const value = {
    subscription,
    loading,
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 