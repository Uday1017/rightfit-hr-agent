import { useNavigate } from "react-router-dom";
import ScoreBar from "./ScoreBar.jsx";

export default function CandidateCard({ candidate, index }) {
  const navigate = useNavigate();
  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-indigo-500 transition-all"
      onClick={() => navigate(`/candidate/${index}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-white">{candidate.name}</h3>
          <p className="text-xs text-gray-400">{candidate.filename}</p>
        </div>
        <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full">
          {candidate.recommendation}
        </span>
      </div>
      <ScoreBar score={candidate.score} />
      <p className="text-sm text-gray-400 mt-3 line-clamp-2">{candidate.summary}</p>
      <div className="flex flex-wrap gap-1 mt-3">
        {candidate.topSkills?.slice(0, 4).map((s) => (
          <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{s}</span>
        ))}
      </div>
    </div>
  );
}
