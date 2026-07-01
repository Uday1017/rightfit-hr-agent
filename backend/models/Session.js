import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  id: String,
  filename: String,
  text: String,
  parsed: { type: mongoose.Schema.Types.Mixed, default: null },
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled Session' },
  jobDescription: String,
  resumes: [resumeSchema],
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Session', sessionSchema);
