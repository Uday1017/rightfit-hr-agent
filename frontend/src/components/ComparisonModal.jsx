import { useState } from "react";
import { compareCandidate } from "../services/api.js";
import ComparisonTable from "./ComparisonTable.jsx";

export default function ComparisonModal({ candidates, jobDescription, onClose }) {
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const selectedCandidates = candidates.filter(c => selected.includes(c.id));

  const handleCompare = async () => {
    if (selectedCandidates.length < 2) {
      setError("Select at least 2 candidates");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await compareCandidate({
        candidates: selectedCandidates,
        jobDescription
      });
      setComparison(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate comparison");
      console.error("Comparison error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 py-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Compare Candidates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {!comparison ? (
          <>
            {/* Selection Phase */}
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Select 2-3 candidates to compare side-by-side</p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {candidates.map(candidate => (
                  <label
                    key={candidate.id}
                    className="flex items-start gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-indigo-600/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(candidate.id)}
                      onChange={() => toggleSelect(candidate.id)}
                      disabled={!selected.includes(candidate.id) && selected.length >= 3}
                      className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">{candidate.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        <span className="inline-block mr-4">Score: {candidate.score}/100</span>
                        <span className="inline-block">{candidate.recommendation}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{candidate.summary}</p>
                    </div>
                  </label>
                ))}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompare}
                  disabled={selectedCandidates.length < 2 || loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Comparing...
                    </>
                  ) : (
                    `Compare ${selectedCandidates.length} Candidate${selectedCandidates.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Comparison Results Phase */}
            <ComparisonTable
              comparison={comparison.comparison}
              candidates={comparison.candidates}
              loading={false}
            />

            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-800">
              <button
                onClick={() => {
                  setComparison(null);
                  setSelected([]);
                  setError(null);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
