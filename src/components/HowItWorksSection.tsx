
const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-20">
          <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider mb-2 block">Process</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">How Quiz.io Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Three simple steps to transform your study materials into effective learning tools.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
          
          <div className="text-center relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-8 shadow-lg shadow-purple-200">1</div>
            <h3 className="text-2xl font-bold mb-4">Upload Your PDFs</h3>
            <p className="text-gray-600 leading-relaxed mx-auto max-w-xs">
              Simply drag and drop your study materials, lecture notes, or textbook PDFs.
            </p>
          </div>
          
          <div className="text-center relative animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-8 shadow-lg shadow-purple-200">2</div>
            <h3 className="text-2xl font-bold mb-4">AI Analysis</h3>
            <p className="text-gray-600 leading-relaxed mx-auto max-w-xs">
              Our advanced AI reads and understands your content, identifying key concepts and knowledge points.
            </p>
          </div>
          
          <div className="text-center relative animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-8 shadow-lg shadow-purple-200">3</div>
            <h3 className="text-2xl font-bold mb-4">Study Smarter</h3>
            <p className="text-gray-600 leading-relaxed mx-auto max-w-xs">
              Access your personalized quizzes, flashcards, and mock tests anytime, anywhere.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
