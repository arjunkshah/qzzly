
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of students who have transformed their study habits with Quiz.io.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-purple-600 font-semibold">JD</span>
              </div>
              <div>
                <h4 className="font-semibold">Jamie Davis</h4>
                <p className="text-gray-500 text-sm">Medical Student</p>
              </div>
            </div>
            <p className="text-gray-600">
              "Quiz.io helped me prepare for my anatomy exams in half the time. The AI-generated questions were spot-on and covered exactly what I needed to know."
            </p>
            <div className="mt-4 flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold">MK</span>
              </div>
              <div>
                <h4 className="font-semibold">Michael Kim</h4>
                <p className="text-gray-500 text-sm">Law Student</p>
              </div>
            </div>
            <p className="text-gray-600">
              "The flashcards generated from my case law notes were incredibly helpful. I could study on the go and the spaced repetition system helped me memorize key precedents."
            </p>
            <div className="mt-4 flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-semibold">SP</span>
              </div>
              <div>
                <h4 className="font-semibold">Sarah Patel</h4>
                <p className="text-gray-500 text-sm">Computer Science Major</p>
              </div>
            </div>
            <p className="text-gray-600">
              "The mock tests generated from my programming textbooks were challenging and comprehensive. I aced my final exams thanks to Quiz.io!"
            </p>
            <div className="mt-4 flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
