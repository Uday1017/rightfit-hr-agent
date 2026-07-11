import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useChat } from "../hooks/useChat.js";
import ChatWindow from "../components/ChatWindow.jsx";
import VoiceButton from "../components/VoiceButton.jsx";
import Loader from "../components/Loader.jsx";
import { uploadPolicy, getPolicyDocs } from "../services/api.js";

export default function Chat() {
  const { sessionId, candidates } = useApp();
  const { messages, loading, send } = useChat(sessionId);
  const [input, setInput] = useState("");
  const [policyDocs, setPolicyDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (!sessionId) return;
    getPolicyDocs(sessionId)
      .then(res => setPolicyDocs(res.data.docs || []))
      .catch(() => {});
  }, [sessionId]);

  async function handlePolicyUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('policies', f));
      formData.append('sessionId', sessionId);
      await uploadPolicy(formData);
      const res = await getPolicyDocs(sessionId);
      setPolicyDocs(res.data.docs || []);
    } catch (err) {
      console.error('Policy upload failed:', err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    send(text);
  }

  const resumeCount = candidates?.length || 0;
  const policyCount = policyDocs.length;

  const SidebarContent = () => (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Agent Context</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Resumes</span>
            <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">{resumeCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">HR Policies</span>
            <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">{policyCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Upload Policy</p>
        <p className="text-xs text-gray-500 mb-3">HR handbook, leave policy, job descriptions</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs py-2 rounded-lg transition-all"
        >
          {uploading ? 'Uploading...' : '+ Upload Document'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.txt" multiple className="hidden" onChange={handlePolicyUpload} />
        {policyDocs.length > 0 && (
          <ul className="mt-3 space-y-1">
            {policyDocs.map(d => (
              <li key={d} className="text-xs text-gray-500 truncate" title={d}>📄 {d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto px-2 sm:px-4">

      {/* Mobile context toggle bar */}
      <div className="sm:hidden flex items-center justify-between py-2 border-b border-gray-800">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">{resumeCount} resumes</span>
          <span className="bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">{policyCount} policies</span>
        </div>
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-800 touch-manipulation"
        >
          {showContext ? 'Hide ✕' : '⚙ Context'}
        </button>
      </div>

      {/* Mobile collapsible context panel */}
      {showContext && (
        <div className="sm:hidden p-3 border-b border-gray-800 bg-gray-950">
          <SidebarContent />
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-4 py-4">
        {/* Desktop sidebar */}
        <div className="hidden sm:flex flex-col w-52 gap-4 shrink-0">
          <SidebarContent />
        </div>

        {/* Chat area */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <div className="flex-1 overflow-hidden flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm text-center px-4">
                Ask anything about candidates, HR policies, or salary benchmarks.
              </div>
            ) : (
              <ChatWindow messages={messages} />
            )}
            {loading && <div className="px-4 pb-2"><Loader text="Thinking..." /></div>}
          </div>
          <div className="border-t border-gray-800 py-3 flex gap-2">
            <input
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 sm:px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <VoiceButton onTranscript={setInput} />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation min-w-[56px]"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
