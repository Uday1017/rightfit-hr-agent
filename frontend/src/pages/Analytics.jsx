import { useEffect, useState } from "react";
import { getAnalytics } from "../services/api.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff", "#f43f5e"];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
      <p className="font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading analytics...</div>
  );

  if (!data || data.empty) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-gray-400 text-lg mb-2">No data yet</p>
      <p className="text-gray-600 text-sm">Screen some resumes to see analytics across all your sessions.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-gray-500 text-sm">Aggregated across all your hiring sessions</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Resumes" value={data.totalResumes} sub="across all sessions" />
        <StatCard label="Hiring Sessions" value={data.totalSessions} />
        <StatCard label="Avg Match Score" value={`${data.avgScore}/100`} sub="across all candidates" />
        <StatCard label="Top Skills Found" value={data.topSkills.length} sub="unique skills tracked" />
      </div>

      {/* score distribution + recommendation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.scoreDist} barSize={32}>
              <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
              <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Hire Recommendations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.recommendations} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.recommendations.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span className="text-gray-400 text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* top skills */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Top Skills Across All Candidates</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.topSkills} layout="vertical" barSize={18}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="skill" tick={{ fill: '#e5e7eb', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
            <Bar dataKey="count" name="Candidates" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* session comparison */}
      {data.sessionScores.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Avg Score by Session</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.sessionScores} barSize={36}>
              <XAxis dataKey="title" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
              <Bar dataKey="avgScore" name="Avg Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
