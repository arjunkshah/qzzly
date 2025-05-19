
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-10 md:p-16 shadow-2xl overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full -ml-20 -mb-20" />
          
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight">
              Ready to Transform Your Study Habits?
            </h2>
            <p className="text-xl text-purple-100 mb-10 leading-relaxed">
              Join thousands of students who are studying smarter, not harder. Try Quiz.io today and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 px-10 py-7 text-lg font-bold rounded-xl">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-2 border-white px-10 py-7 hover:bg-white/10 text-lg font-bold rounded-xl">
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
