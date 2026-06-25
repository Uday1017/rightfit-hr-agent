import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import ScoreBar from "../components/ScoreBar.jsx";

export default function Candidate() {
  const { id } = useParams();
  const { candidates } = useApp();
  const navigate = useNavigate();
  const c = candidates[parseInt(id)];

  if (!c) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <p className="text-gray-400">Candidate not found. <button onClick={() => navigate("/dashboard")} className="text-indigo-400">Go back</button></p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm mb-6">← Back</button>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{c.name}</h2>
            <p className="text-gray-400 text-sm">{c.filename}</p>
          </div>
          <span className="bg-indigo-900 text-indigo-300 text-sm px-3 py-1 rounded-full">{c.recommendation}</span>
        </div>
        <ScoreBar score={c.score} />
        <p className="text-gray-300 text-sm">{c.summary}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
            <ul className="space-y-1">{c.strengths?.map((s, i) => <li key={i} className="text-sm text-gray-300">✓ {s}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2">Gaps</h4>
            <ul className="space-y-1">{c.gaps?.map((g, i) => <li key={i} className="text-sm text-gray-300">✗ {g}</li>)}</ul>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Top Skills</h4>
          <div className="flex flex-wrap gap-2">
            {c.topSkills?.map((s) => <span key={s} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">{s}</span>)}
          </div>
        </div>
        <p className="text-xs text-gray-500">Experience: {c.yearsOfExperience} years</p>
      </div>
    </div>
  );
}
