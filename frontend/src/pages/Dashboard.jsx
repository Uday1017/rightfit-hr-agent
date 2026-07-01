import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import CandidateCard from "../components/CandidateCard.jsx";
import { Link } from "react-router-dom";
import { getSessionResumes, getUserSessions, createSession, deleteResume, renameSession } from "../services/api.js";

export default function Dashboard() {
  const { candidates, setCandidates, sessionId, switchSession, sessions, setSessions, jobDescription, setJobDescription } = useApp();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  async function handleRename(sid) {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    await renameSession(sid, trimmed).catch(() => {});
    setSessions(prev => prev.map(s => s.sessionId === sid ? { ...s, title: trimmed } : s));
    setRenamingId(null);
  }

  useEffect(() => {
    getUserSessions()
      .then(res => setSessions(res.data.sessions))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionId || candidates.length) return;
    getSessionResumes(sessionId)
      .then(res => {
        if (res.data.resumes.length) {
          setCandidates(res.data.resumes.map(r => ({ ...r.screening, filename: r.filename, id: r.id })));
          if (res.data.jobDescription) setJobDescription(res.data.jobDescription);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  async function handleDelete(resumeId) {
    await deleteResume(sessionId, resumeId).catch(() => {});
    setCandidates(prev => prev.filter(c => c.id !== resumeId));
  }

  async function handleNewSession() {
    const title = prompt("Session name (e.g. Frontend Hiring)") || "Untitled Session";
    const res = await createSession({ title });
    const { sessionId: newId } = res.data;
    switchSession(newId);
    setSessions(prev => [{ sessionId: newId, title, createdAt: new Date() }, ...prev]);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Candidates</h2>
        <button onClick={handleNewSession} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm">
          + New Session
        </button>
      </div>

      {sessions.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {sessions.map(s => (
            <div key={s.sessionId} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-all ${
              s.sessionId === sessionId ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-600 text-gray-400'
            }`}>
              {renamingId === s.sessionId ? (
                <input
                  autoFocus
                  className="bg-transparent outline-none text-white w-32 text-sm"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(s.sessionId)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(s.sessionId); if (e.key === 'Escape') setRenamingId(null); }}
                />
              ) : (
                <span className="cursor-pointer" onClick={() => switchSession(s.sessionId)}>{s.title}</span>
              )}
              <button
                onClick={e => { e.stopPropagation(); setRenamingId(s.sessionId); setRenameValue(s.title); }}
                className="ml-1 opacity-50 hover:opacity-100 text-xs"
                title="Rename session"
              >✏️</button>
            </div>
          ))}
        </div>
      )}

      {!candidates.length ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <p className="text-gray-400 mb-4">No candidates in this session yet.</p>
          <Link to="/screen" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg">
            Screen Resumes
          </Link>
        </div>
      ) : (
        <>
          {jobDescription && <p className="text-sm text-gray-400 mb-6 line-clamp-2">Role: {jobDescription}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((c, i) => <CandidateCard key={c.id || i} candidate={c} index={i} onDelete={handleDelete} />)}
          </div>
        </>
      )}
    </div>
  );
}
