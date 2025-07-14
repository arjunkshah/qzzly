import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <NavBar />
      <main className="flex flex-1 flex-col items-center justify-center py-16">
        <div className="flex flex-col items-center">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 animate-float">
            <ellipse cx="60" cy="60" rx="55" ry="55" fill="#ede9fe" />
            <ellipse cx="60" cy="60" rx="40" ry="40" fill="#a5b4fc" />
            <path d="M60 80c-10 0-18-8-18-18s8-18 18-18 18 8 18 18-8 18-18 18zm0-8a10 10 0 100-20 10 10 0 000 20z" fill="#7c3aed" />
            <circle cx="50" cy="55" r="3" fill="#fff" />
            <circle cx="70" cy="55" r="3" fill="#fff" />
            <ellipse cx="60" cy="70" rx="6" ry="3" fill="#fff" />
          </svg>
          <h1 className="text-5xl font-extrabold text-purple-700 mb-2">404</h1>
          <p className="text-xl text-gray-600 mb-6">Sorry, we couldn't find that page.</p>
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 px-8 py-3 text-lg font-semibold shadow-md" asChild>
            <a href="/sessions">Go to My Sessions</a>
          </Button>
          <Button variant="ghost" className="mt-2 text-purple-600 hover:underline" asChild>
            <a href="/">Back to Home</a>
          </Button>
      </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
