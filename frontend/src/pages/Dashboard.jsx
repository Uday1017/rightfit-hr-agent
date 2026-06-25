import { useApp } from "../context/AppContext.jsx";
import CandidateCard from "../components/CandidateCard.jsx";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { candidates, jobDescription } = useApp();

  if (!candidates.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <p className="text-gray-400 mb-4">No candidates screened yet.</p>
        <Link to="/screen" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg">
          Screen Resumes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">Candidates</h2>
      {jobDescription && <p className="text-sm text-gray-400 mb-6 line-clamp-2">Role: {jobDescription}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((c, i) => <CandidateCard key={i} candidate={c} index={i} />)}
      </div>
    </div>
  );
}
