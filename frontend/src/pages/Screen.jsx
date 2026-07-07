import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import FileUpload from "../components/FileUpload.jsx";
import { uploadResumes, getJobStatus, getSessionResumes } from "../services/api.js";

const STATUS_COLORS = {
  waiting: "bg-gray-600",
  active: "bg-indigo-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

export default function Screen() {
  const { sessionId, setCandidates, setJobDescription } = useApp();
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jobStatuses, setJobStatuses] = useState([]); // [{ jobId, filename, state, progress }]
  const pollRef = useRef(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!files.length) return;
    setError("");
    setSubmitting(true);
    setJobStatuses([]);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("resumes", f));
      fd.append("sessionId", sessionId);
      if (jd) fd.append("jobDescription", jd);

      const { data } = await uploadResumes(fd);
      const initial = data.jobIds.map((jobId, i) => ({
        jobId,
        filename: files[i].name,
        state: "waiting",
        progress: 0,
      }));
      setJobStatuses(initial);
      setJobDescription(jd);
      pollJobs(data.jobIds, data.sessionId);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
      setSubmitting(false);
    }
  }

  function pollJobs(jobIds, sid) {
    pollRef.current = setInterval(async () => {
      try {
        const results = await Promise.all(jobIds.map((id) => getJobStatus(id)));
        const statuses = results.map((r) => ({
          jobId: r.data.jobId,
          filename: r.data.filename,
          state: r.data.state,
          progress: r.data.progress || 0,
          result: r.data.result,
        }));

        setJobStatuses(statuses);

        const allDone = statuses.every((s) => s.state === "completed" || s.state === "failed");
        if (allDone) {
          clearInterval(pollRef.current);
          setSubmitting(false);

          // Fetch final session resumes from DB
          const { data } = await getSessionResumes(sid);
          const screened = data.resumes.map((r) => ({ ...r.screening, filename: r.filename, id: r.id }));
          setCandidates(screened);
          navigate("/dashboard");
        }
      } catch {
        clearInterval(pollRef.current);
        setSubmitting(false);
      }
    }, 1500);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">Screen Resumes</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Job Description</label>
          <textarea
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm h-32 resize-none focus:outline-none focus:border-indigo-500"
            placeholder="Paste the job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Upload Resumes</label>
          <FileUpload onFiles={setFiles} disabled={submitting} />
          {files.length > 0 && !submitting && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => <li key={i} className="text-xs text-gray-400">📄 {f.name}</li>)}
            </ul>
          )}
        </div>

        {/* Per-file progress bars */}
        {jobStatuses.length > 0 && (
          <div className="space-y-3">
            {jobStatuses.map((job) => (
              <div key={job.jobId}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="truncate max-w-[70%]">📄 {job.filename}</span>
                  <span className="capitalize">{job.state === "active" ? `${job.progress}%` : job.state}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${STATUS_COLORS[job.state] || "bg-gray-600"}`}
                    style={{ width: job.state === "completed" ? "100%" : job.state === "waiting" ? "5%" : `${job.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!files.length || submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-3 rounded-xl font-semibold transition-all"
        >
          {submitting ? "Processing..." : `Screen ${files.length > 0 ? `${files.length} Resume${files.length > 1 ? "s" : ""}` : "Resumes"}`}
        </button>
      </form>
    </div>
  );
}
