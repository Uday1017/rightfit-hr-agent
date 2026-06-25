import { useEffect, useRef } from "react";

export default function ChatWindow({ messages }) {
  const bottomRef = useRef();
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-200"
            }`}
          >
            {m.content}
            {m.sources?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                {m.sources.map((s, j) => (
                  <div key={j}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{s.title || s.url}</a> : `📄 ${s.doc} (${s.relevance}%)`}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
