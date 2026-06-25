import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const uploadResumes = (formData) => api.post("/resumes/upload", formData);
export const rankCandidates = (data) => api.post("/resumes/rank", data);
export const sendChat = (data) => api.post("/chat", data);
export const getJobs = () => api.get("/jobs");
export const createJob = (data) => api.post("/jobs", data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
