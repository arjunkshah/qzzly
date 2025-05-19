
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Study Habits?
            </h2>
            <p className="text-lg text-purple-100 mb-8">
              Join thousands of students who are studying smarter, not harder. Try Quiz.io today and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="bg-white text-purple-600 px-8 py-6 hover:bg-purple-50">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border border-white px-8 py-6 hover:bg-white/10">
                <Play className="w-5 h-5 mr-2" /> Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
