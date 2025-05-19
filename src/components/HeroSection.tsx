
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight animate-fade-in">
            Transform Your <span className="gradient-text">Study Material</span> Into Interactive Quizzes
          </h1>
          <p className="text-lg text-gray-600 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Upload your PDFs and let our AI generate personalized quizzes, flashcards, and mock tests to accelerate your learning journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button className="gradient-bg text-white px-6 py-6 rounded-lg text-lg font-medium">
              Get Started Free
            </Button>
            <Button variant="outline" className="bg-white border border-gray-300 px-6 py-6 rounded-lg text-lg font-medium">
              <Play className="w-5 h-5 mr-2" /> Watch Demo
            </Button>
          </div>
        </div>
        <div className="md:w-1/2 md:pl-10 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Try it now</h3>
            <div 
              id="upload-container" 
              className="upload-area rounded-lg p-8 text-center cursor-pointer mb-4"
            >
              <svg className="w-12 h-12 mx-auto text-purple-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-gray-600 mb-2">Drag & drop your PDF files here</p>
              <p className="text-gray-400 text-sm">or</p>
              <Button 
                variant="outline" 
                className="mt-2 px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
              >
                Browse files
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
