import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

export const uploadResumes = (formData) => api.post('/resumes/upload', formData);
export const rankCandidates = (data) => api.post('/resumes/rank', data);
export const sendChat = (data) => api.post('/chat', data);
export const getChatHistory = (sessionId) => api.get(`/chat/history/${sessionId}`);
export const generateJD = (data) => api.post('/jobs/generate-jd', data);
