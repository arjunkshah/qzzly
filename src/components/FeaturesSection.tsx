
import { FileText, BookOpen, CheckCircle } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider mb-2 block">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Supercharge Your Learning</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Our AI analyzes your study materials and creates personalized learning resources to help you master any subject.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-md card-hover">
            <div className="feature-icon">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-4">Smart Quizzes</h3>
            <p className="text-gray-600 leading-relaxed">
              AI-generated quizzes that adapt to your knowledge gaps and learning style for maximum retention.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md card-hover">
            <div className="feature-icon">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-4">Interactive Flashcards</h3>
            <p className="text-gray-600 leading-relaxed">
              Turn complex concepts into easy-to-review flashcards with spaced repetition for better memorization.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md card-hover">
            <div className="feature-icon">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-4">Mock Tests</h3>
            <p className="text-gray-600 leading-relaxed">
              Simulate real exam conditions with comprehensive mock tests that prepare you for the real thing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
