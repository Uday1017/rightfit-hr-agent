import { useState } from "react";
import { sendChat } from "../services/api.js";

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function send(text) {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { data } = await sendChat({ sessionId, message: text });
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error getting response." }]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, send };
}
