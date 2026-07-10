import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScoreBar from "./ScoreBar.jsx";
import ScheduleModal from "./ScheduleModal.jsx";

export default function CandidateCard({ candidate, index, onDelete, onSelectionChange, isSelected }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  function handleDeleteClick(e) {
    e.stopPropagation();
    setConfirming(true);
  }

  function handleCancel(e) {
    e.stopPropagation();
    setConfirming(false);
  }

  function handleConfirm(e) {
    e.stopPropagation();
    setConfirming(false);
    onDelete(candidate.id);
  }

  function handleCheckboxChange(e) {
    e.stopPropagation();
    onSelectionChange?.(candidate.id);
  }

  return (
    <>
      <div
        className={`bg-gray-900 border rounded-xl p-5 hover:border-indigo-500 transition-all relative ${
          isSelected ? 'border-indigo-500 bg-indigo-900/10' : 'border-gray-800'
        }`}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3">
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={handleCheckboxChange}
            className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
            title="Select for comparison"
          />
        </div>

        <div className="flex justify-between items-start mb-3 pl-8 onClick={() => navigate(`/candidate/${index}`)} style={{cursor:'pointer'}}>
          <div>
            <h3 className="font-semibold text-white">{candidate.name}</h3>
            <p className="text-xs text-gray-400">{candidate.filename}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full">
              {candidate.recommendation}
            </span>
            <button
              onClick={handleDeleteClick}
              className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded"
              title="Remove candidate"
            >
              🗑️
            </button>
          </div>
        </div>
        <div onClick={() => navigate(`/candidate/${index}`)} style={{cursor:'pointer'}}>
          <ScoreBar score={candidate.score} />
          <p className="text-sm text-gray-400 mt-3 line-clamp-2">{candidate.summary}</p>
          <div className="flex flex-wrap gap-1 mt-3">
            {candidate.topSkills?.slice(0, 4).map((s) => (
              <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{s}</span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setScheduling(true)}
          className="mt-4 w-full bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-700 text-indigo-300 text-xs py-1.5 rounded-lg transition-all"
        >
          Schedule Interview
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCancel}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-2">Remove Candidate</h3>
            <p className="text-gray-400 text-sm mb-1">You are about to remove <span className="text-white font-medium">{candidate.name}</span>.</p>
            <p className="text-red-400 text-sm mb-6">⚠️ This action cannot be undone. Their resume, score, and data will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-lg hover:border-gray-400 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {scheduling && <ScheduleModal candidate={candidate} onClose={() => setScheduling(false)} />}
    </>
  );
}
