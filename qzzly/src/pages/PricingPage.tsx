import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const { subscription, createCheckoutSession, loading } = useSubscription();
  const { toast } = useToast();

  const handleSubscribe = async (priceId: string, planName: string) => {
    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to start checkout for ${planName}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const plans = [
    {
      key: 'FREE',
      plan: SUBSCRIPTION_PLANS.FREE,
      icon: <Star className="h-6 w-6" />,
      popular: false,
    },
    {
      key: 'PRO',
      plan: SUBSCRIPTION_PLANS.PRO,
      icon: <Crown className="h-6 w-6" />,
      popular: true,
    },
    {
      key: 'PREMIUM',
      plan: SUBSCRIPTION_PLANS.PREMIUM,
      icon: <Crown className="h-6 w-6" />,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Start your learning journey with the perfect plan for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map(({ key, plan, icon, popular }) => (
            <Card
              key={key}
              className={`relative ${
                popular
                  ? 'border-2 border-primary shadow-lg scale-105'
                  : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              {popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    {icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={popular ? 'default' : 'outline'}
                  disabled={loading || (subscription?.plan === key.toLowerCase())}
                  onClick={() => handleSubscribe(plan.priceId || '', plan.name)}
                >
                  {subscription?.plan === key.toLowerCase()
                    ? 'Current Plan'
                    : plan.price === 0
                    ? 'Get Started'
                    : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
} 