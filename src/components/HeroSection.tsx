
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useState } from "react";

const HeroSection = () => {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <section className="py-20 md:py-28 container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight animate-fade-in">
            Transform Your <span className="gradient-text">Study Material</span> Into Interactive Quizzes
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed animate-fade-in max-w-lg" style={{ animationDelay: "0.2s" }}>
            Upload your PDFs and let our AI generate personalized quizzes, flashcards, and mock tests to accelerate your learning journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button className="gradient-bg text-white px-8 py-7 rounded-lg text-lg font-medium shadow-lg shadow-purple-200">
              Get Started Free
            </Button>
            <Button variant="outline" className="bg-white border border-gray-300 px-8 py-7 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors">
              <Play className="w-5 h-5 mr-2" /> Watch Demo
            </Button>
          </div>
        </div>
        <div className="md:w-1/2 animate-fade-in animate-float" style={{ animationDelay: "0.6s" }}>
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Try it now</h3>
            <div 
              id="upload-container" 
              className={`upload-area rounded-xl p-10 text-center cursor-pointer mb-6 ${isDragging ? 'border-purple-500 bg-purple-50' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={() => setIsDragging(false)}
            >
              <svg className="w-16 h-16 mx-auto text-purple-500 mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-gray-600 mb-3 text-lg">Drag & drop your PDF files here</p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <Button 
                variant="outline" 
                className="px-6 py-3 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 font-medium"
              >
                Browse files
              </Button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Supported formats: PDF, DOC, DOCX (Max size: 25MB)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
