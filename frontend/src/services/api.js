import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const uploadResumes = (formData) => api.post("/resumes/upload", formData);
export const rankCandidates = (data) => api.post("/resumes/rank", data);
export const sendChat = (data) => api.post("/chat", data);
export const getJobs = () => api.get("/jobs");
export const createJob = (data) => api.post("/jobs", data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
