import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PricingSection = () => {
  const sectionRef = useScrollAnimation<HTMLElement>();
  const { user, updateSubscription } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async (usePromoCode: boolean = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your subscription.",
        variant: "destructive",
      });
      return;
    }

    setIsUpgrading(true);
    try {
      const success = await updateSubscription('pro', usePromoCode ? promoCode : undefined);
      if (success) {
        toast({
          title: "Upgrade Successful!",
          description: usePromoCode 
            ? "Your pro subscription has been activated with the promo code!" 
            : "Your pro subscription has been activated!",
        });
        setShowUpgradeDialog(false);
        setPromoCode('');
      } else {
        toast({
          title: "Upgrade Failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while upgrading. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <section ref={sectionRef} id="pricing" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider mb-2 block">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose the plan that works best for your study needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-10 rounded-2xl shadow-md relative transition-all duration-300 hover:shadow-xl">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-500 mb-6">Perfect for getting started</p>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-500 font-normal">/month</span></div>
            <ul className="mb-10 space-y-4">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">3 study sessions</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">PDF uploads</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Basic AI features</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Flashcards & quizzes</span>
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full py-6 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-medium text-lg"
              onClick={() => window.location.href = '/sessions'}
            >
              {user ? 'Current Plan' : 'Get Started'}
            </Button>
          </div>
          
          <div className="bg-white p-10 rounded-2xl shadow-xl transform md:scale-105 border-2 border-purple-500 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-bold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-gray-500 mb-6">For serious learners</p>
            <div className="text-4xl font-bold mb-6">$9.99<span className="text-lg text-gray-500 font-normal">/month</span></div>
            <ul className="mb-10 space-y-4">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Unlimited study sessions</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Advanced AI features</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Priority support</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Export capabilities</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Custom study plans</span>
              </li>
            </ul>
            <Button 
              className="w-full py-6 gradient-bg text-white text-lg font-medium shadow-lg shadow-purple-200"
              onClick={() => setShowUpgradeDialog(true)}
              disabled={user?.subscription.plan === 'pro'}
            >
              {user?.subscription.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </Button>
          </div>
        </div>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upgrade to Pro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="promo-code">Promo Code (Optional)</Label>
                <Input
                  id="promo-code"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use code "BETAX" for free pro access
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleUpgrade(false)}
                  disabled={isUpgrading}
                  className="flex-1"
                >
                  {isUpgrading ? 'Processing...' : 'Pay $9.99/month'}
                </Button>
                {promoCode && (
                  <Button
                    onClick={() => handleUpgrade(true)}
                    disabled={isUpgrading}
                    variant="outline"
                    className="flex-1"
                  >
                    {isUpgrading ? 'Processing...' : 'Use Promo Code'}
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                By upgrading, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default PricingSection;
