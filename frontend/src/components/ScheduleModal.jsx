import { useState } from "react";
import { generateInterviewEmail, sendInterviewEmail } from "../services/api.js";

export default function ScheduleModal({ candidate, onClose }) {
  const [form, setForm] = useState({
    candidateEmail: "",
    interviewDate: "",
    interviewTime: "",
    meetLink: "",
    recruiterName: "",
    companyName: "RightFit",
  });
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [step, setStep] = useState("form"); // form | preview | sent
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!form.candidateEmail || !form.interviewDate || !form.interviewTime || !form.recruiterName) {
      setError("Please fill all required fields."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await generateInterviewEmail({
        candidateName: candidate.name,
        role: candidate.filename?.replace('.pdf', '') || 'the position',
        ...form,
      });
      setSubject(res.data.subject);
      setEmailBody(res.data.emailBody);
      setStep("preview");
    } catch { setError("Failed to generate email. Try again."); }
    finally { setLoading(false); }
  }

  async function handleSend() {
    setLoading(true); setError("");
    try {
      await sendInterviewEmail({
        to: form.candidateEmail,
        subject,
        emailBody,
        candidateName: candidate.name,
        recruiterName: form.recruiterName,
      });
      setStep("sent");
    } catch { setError("Failed to send email. Check your email credentials in .env."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold text-lg">Schedule Interview</h3>
            <p className="text-gray-400 text-sm">{candidate.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5">

          {step === "form" && (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Candidate Email *</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="candidate@email.com" value={form.candidateEmail}
                  onChange={e => update('candidateEmail', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Interview Date *</label>
                  <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    value={form.interviewDate} onChange={e => update('interviewDate', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Interview Time *</label>
                  <input type="time" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    value={form.interviewTime} onChange={e => update('interviewTime', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Google Meet Link</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="https://meet.google.com/..." value={form.meetLink}
                  onChange={e => update('meetLink', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Your Name *</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Recruiter name" value={form.recruiterName}
                    onChange={e => update('recruiterName', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Company Name</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    value={form.companyName} onChange={e => update('companyName', e.target.value)} />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                {loading ? "Generating email..." : "✨ Generate Email with AI"}
              </button>
            </form>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Subject</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email Body — edit if needed</label>
                <textarea className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  rows={12} value={emailBody} onChange={e => setEmailBody(e.target.value)} />
              </div>
              <p className="text-xs text-gray-500">Sending to: <span className="text-gray-300">{form.candidateEmail}</span></p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep("form")} className="flex-1 border border-gray-600 text-gray-300 py-2 rounded-xl text-sm hover:border-gray-400 transition-all">
                  ← Edit Details
                </button>
                <button onClick={handleSend} disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white py-2 rounded-xl text-sm font-semibold transition-all">
                  {loading ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          )}

          {step === "sent" && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h4 className="text-white font-semibold text-lg mb-2">Email Sent!</h4>
              <p className="text-gray-400 text-sm mb-6">Interview invitation sent to <span className="text-white">{form.candidateEmail}</span></p>
              <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-semibold">
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
