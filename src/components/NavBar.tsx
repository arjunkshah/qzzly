
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <header className="bg-white py-4 border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl font-bold flex items-center">
              <div className="w-8 h-8 mr-2 gradient-bg rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                  <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="currentColor" fillOpacity="0.8" />
                </svg>
              </div>
              Quiz.io
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-purple-600 transition">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-purple-600 transition">How it Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition">Pricing</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="hidden md:block border-purple-300 text-purple-600 hover:bg-purple-50">
              Log in
            </Button>
            <Button className="gradient-bg">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
