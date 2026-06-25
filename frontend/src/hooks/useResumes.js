import { useState } from "react";
import { uploadResumes, rankCandidates } from "../services/api.js";

export function useResumes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function upload(files, sessionId, jobDescription) {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("resumes", f));
      fd.append("sessionId", sessionId);
      if (jobDescription) fd.append("jobDescription", jobDescription);
      const { data } = await uploadResumes(fd);
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function rank(candidates, jobDescription) {
    setLoading(true);
    try {
      const { data } = await rankCandidates({ candidates, jobDescription });
      return data.ranking;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, upload, rank };
}
