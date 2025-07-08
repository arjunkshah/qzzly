import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check } from 'lucide-react';

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Quiz.io',
    features: [
      '1 study session per month',
      'All AI features within session',
      'PDF upload (up to 10MB)',
      'Basic support',
    ],
    priceId: null,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: 'per month',
    description: 'For serious students',
    features: [
      'Unlimited study sessions',
      'All AI features',
      'Unlimited PDF uploads',
      'Priority support',
      'Export to PDF/Word',
      'Advanced analytics',
    ],
    priceId: 'price_pro_monthly',
    popular: true,
  },
];

export default function PricingPage() {
  const { subscription, createCheckoutSession, createPortalSession } = useSubscription();

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!priceId) {
      alert('This plan is not available for purchase.');
      return;
    }

    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    }
  };

  const handleManageSubscription = async () => {
    try {
      await createPortalSession();
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open billing portal. Please try again.');
    }
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.plan === planId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our free plan and upgrade when you need more sessions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-purple-500 shadow-lg scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan(plan.id) ? (
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                    {plan.id !== 'free' && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleManageSubscription}
                      >
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.priceId!, plan.name)}
                    disabled={!plan.priceId}
                  >
                    {plan.priceId ? 'Get Started' : 'Current Plan'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
} 