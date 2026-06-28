import { useEffect } from "react";
import { useApp } from "../context/AppContext.jsx";
import CandidateCard from "../components/CandidateCard.jsx";
import { Link } from "react-router-dom";
import { getSessionResumes } from "../services/api.js";

export default function Dashboard() {
  const { candidates, setCandidates, sessionId, jobDescription, setJobDescription } = useApp();

  useEffect(() => {
    if (candidates.length) return;
    getSessionResumes(sessionId)
      .then(res => {
        if (res.data.resumes.length) {
          setCandidates(res.data.resumes);
          if (res.data.jobDescription) setJobDescription(res.data.jobDescription);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  if (!candidates.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <p className="text-gray-400 mb-4">No candidates screened yet.</p>
        <Link to="/screen" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg">
          Screen Resumes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">Candidates</h2>
      {jobDescription && <p className="text-sm text-gray-400 mb-6 line-clamp-2">Role: {jobDescription}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((c, i) => <CandidateCard key={i} candidate={c} index={i} />)}
      </div>
    </div>
  );
}
