# RightFit HR Agent

AI-powered HR assistant for resume screening, candidate ranking, and HR Q&A.

## Stack
- **Backend**: Node.js + Express + Gemini 2.5 Flash (RAG + Web Search)
- **Frontend**: React + Vite + Tailwind CSS

## Setup

### Backend
```bash
cd backend
npm install
# Add your Gemini API key to .env
npm run dev        # runs on http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

## Features
- Upload multiple resumes (PDF/TXT) and screen against a job description
- AI scoring, strengths/gaps, and recommendation per candidate
- RAG-based chat over uploaded resumes
- Web search fallback for market/salary questions
- Voice input support
