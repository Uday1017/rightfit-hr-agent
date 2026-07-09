import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const saveApiKey = (key) => api.post("/auth/api-key", { geminiApiKey: key });
export const getApiKey = () => api.get("/auth/api-key");
export const uploadResumes = (formData) => api.post("/resumes/upload", formData);
export const getJobStatus = (jobId) => api.get(`/resumes/job/${jobId}/status`);
export const getSessionResumes = (sessionId) => api.get(`/resumes/session/${sessionId}`);
export const getUserSessions = () => api.get("/resumes/sessions");
export const createSession = (data) => api.post("/resumes/sessions", data);
export const renameSession = (sessionId, title) => api.patch(`/resumes/sessions/${sessionId}`, { title });
export const deleteResume = (sessionId, resumeId) => api.delete(`/resumes/session/${sessionId}/resume/${resumeId}`);
export const rankCandidates = (data) => api.post("/resumes/rank", data);
export const sendChat = (data) => api.post("/chat", data);
export const getChatHistory = (sessionId) => api.get(`/chat/history/${sessionId}`);
export const uploadPolicy = (formData) => api.post("/policies/upload", formData);
export const getPolicyDocs = (sessionId) => api.get(`/policies/docs/${sessionId}`);
export const getJobs = () => api.get("/jobs");
export const createJob = (data) => api.post("/jobs", data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
export const getAnalytics = () => api.get("/analytics");
export const generateInterviewEmail = (data) => api.post("/interview/generate-email", data);
export const sendInterviewEmail = (data) => api.post("/interview/send-email", data);
