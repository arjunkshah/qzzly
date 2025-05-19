
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const NavBar = () => {
  return (
    <header className="bg-white py-5 border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur-lg bg-white/90">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold flex items-center">
              <div className="w-9 h-9 mr-2 gradient-bg rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                  <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="currentColor" fillOpacity="0.8" />
                </svg>
              </div>
              <span className="font-extrabold tracking-tighter">Quiz.io</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-10">
            <a href="/#features" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">Features</a>
            <a href="/#how-it-works" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">How it Works</a>
            <a href="/#pricing" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">Pricing</a>
            <Link to="/sessions" className="text-gray-600 hover:text-purple-600 transition font-medium text-sm">My Sessions</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="hidden md:flex border-purple-300 text-purple-600 hover:bg-purple-50 font-medium">
              Log in
            </Button>
            <Button className="gradient-bg font-medium shadow-md shadow-purple-200">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
