
import { FileText, BookOpen, CheckCircle } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Supercharge Your Learning</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI analyzes your study materials and creates personalized learning resources to help you master any subject.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="feature-icon">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Smart Quizzes</h3>
            <p className="text-gray-600">
              AI-generated quizzes that adapt to your knowledge gaps and learning style for maximum retention.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="feature-icon">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Interactive Flashcards</h3>
            <p className="text-gray-600">
              Turn complex concepts into easy-to-review flashcards with spaced repetition for better memorization.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="feature-icon">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Mock Tests</h3>
            <p className="text-gray-600">
              Simulate real exam conditions with comprehensive mock tests that prepare you for the real thing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
