import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4">
      <h1 className="text-5xl font-bold text-white mb-4">
        Hire Smarter with <span className="text-indigo-400">RightFit</span>
      </h1>
      <p className="text-gray-400 text-lg max-w-xl mb-8">
        AI-powered resume screening, candidate ranking, and HR chat — all in one place.
      </p>
      <div className="flex gap-4">
        <Link to="/screen" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all">
          Screen Resumes
        </Link>
        <Link to="/chat" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
          Open Chat
        </Link>
      </div>
    </div>
  );
}
