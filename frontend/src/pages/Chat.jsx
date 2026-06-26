import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useChat } from "../hooks/useChat.js";
import ChatWindow from "../components/ChatWindow.jsx";
import VoiceButton from "../components/VoiceButton.jsx";
import Loader from "../components/Loader.jsx";

export default function Chat() {
  const { sessionId } = useApp();
  const { messages, loading, send } = useChat(sessionId);
  const [input, setInput] = useState("");

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    send(text);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto px-2 sm:px-4">
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm text-center px-4">
            Ask anything about candidates, HR practices, or salary benchmarks.
          </div>
        ) : (
          <ChatWindow messages={messages} />
        )}
        {loading && <div className="px-4 pb-2"><Loader text="Thinking..." /></div>}
      </div>
      <div className="border-t border-gray-800 py-3 sm:py-4 flex gap-2">
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 sm:px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <VoiceButton onTranscript={setInput} />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );
}
