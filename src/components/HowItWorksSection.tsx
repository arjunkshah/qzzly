
const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Quiz.io Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three simple steps to transform your study materials into effective learning tools.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold mb-3">Upload Your PDFs</h3>
            <p className="text-gray-600">
              Simply drag and drop your study materials, lecture notes, or textbook PDFs.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
            <p className="text-gray-600">
              Our advanced AI reads and understands your content, identifying key concepts and knowledge points.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold mb-3">Study Smarter</h3>
            <p className="text-gray-600">
              Access your personalized quizzes, flashcards, and mock tests anytime, anywhere.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
