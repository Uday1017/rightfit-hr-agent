import { useState } from "react";

export default function ComparisonTable({ comparison, candidates, loading = false }) {
  const [expanded, setExpanded] = useState({});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Analyzing candidates...</p>
        </div>
      </div>
    );
  }

  if (!comparison?.comparison || !comparison.comparison.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No comparison data available</p>
      </div>
    );
  }

  const toggleExpand = (index) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4">
      {/* Summary Section */}
      {comparison.summary && (
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-300 mb-2">Summary</h3>
          <p className="text-sm text-gray-300">{comparison.summary}</p>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300 bg-gray-900/50">Category</th>
              {candidates.map((c, i) => (
                <th key={i} className="text-left py-3 px-4 text-sm font-semibold text-white bg-gray-900/50">
                  <div>{c.name}</div>
                  <div className="text-xs text-gray-400 font-normal">Score: {c.score}/100</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.comparison.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                <td className="py-4 px-4 text-sm font-medium text-indigo-300 bg-gray-900/20">
                  <button
                    onClick={() => toggleExpand(rowIdx)}
                    className="flex items-center gap-2 hover:text-indigo-200 transition-colors"
                  >
                    <span className={`transform transition-transform ${expanded[rowIdx] ? 'rotate-90' : ''}`}>▶</span>
                    {row.category}
                  </button>
                </td>

                {candidates.map((c, colIdx) => {
                  const cellKey = `candidate${colIdx + 1}`;
                  const cellValue = row[cellKey] || '—';
                  const isExpanded = expanded[rowIdx];

                  return (
                    <td
                      key={colIdx}
                      className={`py-4 px-4 text-sm text-gray-300 ${
                        colIdx % 2 === 0 ? 'bg-gray-900/10' : 'bg-gray-900/5'
                      }`}
                    >
                      <div className={`${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {cellValue}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Candidate Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {candidates.map((c, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="font-semibold text-white mb-2">{c.name}</div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold text-indigo-400">{c.score}</div>
              <div className="text-xs text-gray-500 mb-1">/100</div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-1.5 rounded-full transition-all"
                style={{ width: `${c.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
