import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import resumeRoutes from './routes/resume.js';
import chatRoutes from './routes/chat.js';
import jobRoutes from './routes/jobs.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/resumes', resumeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', model: 'gemini-2.5-flash' }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`RightFit backend running on port ${PORT}`));
