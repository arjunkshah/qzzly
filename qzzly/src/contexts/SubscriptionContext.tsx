import React, { createContext, useContext, useEffect, useState } from 'react';
import { StripeService, SubscriptionStatus } from '../services/stripeService';

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: 'free' | 'pro';
  currentPeriodEnd: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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
      const { subscription: sub, error } = await StripeService.getSubscriptionStatus();
      
      if (error) {
        console.error('Error getting subscription status:', error);
        return;
      }

      if (sub) {
        setSubscription({
          id: sub.id,
          status: sub.status,
          plan: sub.plan,
          currentPeriodEnd: sub.currentPeriodEnd,
          stripeCustomerId: sub.stripeCustomerId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
        });
      }
    } catch (error) {
      console.error('Error getting subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      const { sessionId, error } = await StripeService.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/sessions?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        return;
      }

      if (sessionId) {
        // Redirect to Stripe Checkout
        window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const createPortalSession = async () => {
    try {
      const { url, error } = await StripeService.createPortalSession({
        returnUrl: `${window.location.origin}/sessions`,
      });

      if (error) {
        console.error('Error creating portal session:', error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    }
  };

  useEffect(() => {
    getSubscriptionStatus();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        createCheckoutSession,
        createPortalSession,
        getSubscriptionStatus,
      }}
    >
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