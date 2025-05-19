
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works best for your study needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-md relative">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-gray-500 mb-4">Perfect for trying out</p>
            <div className="text-3xl font-bold mb-6">$0<span className="text-lg text-gray-500 font-normal">/month</span></div>
            <ul className="mb-8 space-y-3">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">3 PDF uploads per month</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Basic quizzes</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Limited flashcards</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full py-6 border border-purple-600 text-purple-600 hover:bg-purple-50">
              Get Started
            </Button>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md transform md:scale-105 border-2 border-purple-500 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold mb-2">Student</h3>
            <p className="text-gray-500 mb-4">For serious students</p>
            <div className="text-3xl font-bold mb-6">$9.99<span className="text-lg text-gray-500 font-normal">/month</span></div>
            <ul className="mb-8 space-y-3">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Unlimited PDF uploads</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Advanced quizzes</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Unlimited flashcards</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Mock tests</span>
              </li>
            </ul>
            <Button className="w-full py-6 gradient-bg text-white">
              Start 7-Day Free Trial
            </Button>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md relative">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-gray-500 mb-4">For educators & teams</p>
            <div className="text-3xl font-bold mb-6">$24.99<span className="text-lg text-gray-500 font-normal">/month</span></div>
            <ul className="mb-8 space-y-3">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Everything in Student</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Team sharing</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Analytics dashboard</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-gray-600">Priority support</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full py-6 border border-purple-600 text-purple-600 hover:bg-purple-50">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
