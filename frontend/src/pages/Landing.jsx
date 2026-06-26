import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function Landing() {
  const { user } = useApp();
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4">
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
        Hire Smarter with <span className="text-indigo-400">RightFit</span>
      </h1>
      <p className="text-gray-400 text-base sm:text-lg max-w-xl mb-8 px-2">
        AI-powered resume screening, candidate ranking, and HR chat — all in one place.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
        {user ? (
          <>
            <Link to="/screen" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all text-center">
              Screen Resumes
            </Link>
            <Link to="/chat" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all text-center">
              Open Chat
            </Link>
          </>
        ) : (
          <>
            <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all text-center">
              Get Started
            </Link>
            <Link to="/login" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all text-center">
              Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
