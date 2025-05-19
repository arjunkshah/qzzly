
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider mb-2 block">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">What Our Users Say</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students who have transformed their study habits with Quiz.io.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="testimonial-card">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-purple-600 font-bold text-lg">JD</span>
              </div>
              <div>
                <h4 className="font-bold text-lg">Jamie Davis</h4>
                <p className="text-gray-500 text-sm">Medical Student</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              "Quiz.io helped me prepare for my anatomy exams in half the time. The AI-generated questions were spot-on and covered exactly what I needed to know."
            </p>
            <div className="mt-4 flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold text-lg">MK</span>
              </div>
              <div>
                <h4 className="font-bold text-lg">Michael Kim</h4>
                <p className="text-gray-500 text-sm">Law Student</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              "The flashcards generated from my case law notes were incredibly helpful. I could study on the go and the spaced repetition system helped me memorize key precedents."
            </p>
            <div className="mt-4 flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold text-lg">SP</span>
              </div>
              <div>
                <h4 className="font-bold text-lg">Sarah Patel</h4>
                <p className="text-gray-500 text-sm">Computer Science Major</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
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
