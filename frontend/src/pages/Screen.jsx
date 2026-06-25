import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useResumes } from "../hooks/useResumes.js";
import FileUpload from "../components/FileUpload.jsx";
import Loader from "../components/Loader.jsx";

export default function Screen() {
  const { sessionId, setCandidates, setJobDescription } = useApp();
  const { loading, error, upload } = useResumes();
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!files.length) return;
    const data = await upload(files, sessionId, jd);
    if (data) {
      const screened = data.resumes.map((r) => ({ ...r.screening, filename: r.filename, id: r.id }));
      setCandidates(screened);
      setJobDescription(jd);
      navigate("/dashboard");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">Screen Resumes</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Job Description</label>
          <textarea
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm h-32 resize-none focus:outline-none focus:border-indigo-500"
            placeholder="Paste the job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Upload Resumes</label>
          <FileUpload onFiles={setFiles} />
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => <li key={i} className="text-xs text-gray-400">📄 {f.name}</li>)}
            </ul>
          )}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {loading ? <Loader text="Screening resumes..." /> : (
          <button
            type="submit"
            disabled={!files.length}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl font-semibold transition-all"
          >
            Screen {files.length > 0 ? `${files.length} Resume${files.length > 1 ? "s" : ""}` : "Resumes"}
          </button>
        )}
      </form>
    </div>
  );
}
