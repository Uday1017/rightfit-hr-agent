import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  id: String,
  filename: String,
  text: String,
  screening: {
    name: String,
    score: Number,
    summary: String,
    strengths: [String],
    gaps: [String],
    recommendation: String,
    yearsOfExperience: Number,
    topSkills: [String]
  }
});

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'] },
  content: String,
  sources: [{ title: String, url: String, doc: String, relevance: Number }],
  method: String,
  createdAt: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  jobDescription: String,
  resumes: [resumeSchema],
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Session', sessionSchema);
