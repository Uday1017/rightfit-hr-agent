import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { FileText, Trophy, MessageSquareText } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "OCR Resume Parsing",
    desc: "Upload any PDF — scanned or digital. Gemini Vision extracts every detail including tables and formatting.",
  },
  {
    icon: Trophy,
    title: "AI Candidate Ranking",
    desc: "Every resume gets a match score out of 100 with strengths, gaps, top skills, and a hire recommendation.",
  },
  {
    icon: MessageSquareText,
    title: "HR Chat + Web Search",
    desc: "Ask anything about your candidates. Need salary benchmarks? The agent searches the web automatically.",
  },
];

const steps = [
  { number: "01", title: "Upload Resumes", desc: "Paste a job description and upload one or more PDF resumes." },
  { number: "02", title: "AI Scores & Ranks", desc: "Gemini reads every resume and ranks candidates by fit in seconds." },
  { number: "03", title: "Chat with the Agent", desc: "Ask questions by text or voice. Get answers from resumes or live web data." },
];

export default function Landing() {
  const { user } = useApp();

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-purple-700/10 rounded-full blur-[100px]" />
      </div>

      {/* hero */}
      <div className="flex flex-col items-center justify-center text-center px-4 pt-12 pb-8">
        <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-4 border border-indigo-800 px-3 py-1 rounded-full">
          Powered by Gemini AI
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight max-w-3xl">
          Hire Smarter with <span className="text-indigo-400">RightFit</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mb-7">
          AI-powered resume screening, candidate ranking, and HR chat — all in one place. Replace hours of manual review with seconds of AI analysis.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {user ? (
            <>
              <Link to="/screen" className="bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl font-semibold transition-all text-center">
                Screen Resumes
              </Link>
              <Link to="/chat" className="bg-gray-800 hover:bg-gray-700 text-white px-7 py-3 rounded-xl font-semibold transition-all text-center">
                Open Chat
              </Link>
            </>
          ) : (
            <>
              <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl font-semibold transition-all text-center">
                Get Started Free
              </Link>
              <Link to="/login" className="bg-gray-800 hover:bg-gray-700 text-white px-7 py-3 rounded-xl font-semibold transition-all text-center">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* feature cards */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 hover:border-indigo-700 transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-3">
                <f.icon size={20} className="text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* how it works */}
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <h2 className="text-center text-xl font-bold text-white mb-7">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
          {/* connector line */}
          <div className="hidden sm:block absolute top-7 left-[20%] right-[20%] h-px bg-gradient-to-r from-indigo-800 via-indigo-500 to-indigo-800" />
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center text-center relative">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-700 flex items-center justify-center text-indigo-300 font-bold text-sm mb-3 z-10 bg-gray-950">
                {s.number}
              </div>
              <h3 className="text-white font-semibold mb-1">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
