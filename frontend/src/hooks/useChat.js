import { useState, useEffect } from 'react';
import { sendChat, getChatHistory } from '../services/api.js';

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load chat history when component mounts
  useEffect(() => {
    if (!sessionId) return;
    getChatHistory(sessionId)
      .then(({ data }) => {
        if (data.messages?.length) {
          setMessages(data.messages.map(m => ({
            role: m.role,
            content: m.content,
            sources: m.sources || []
          })));
        }
      })
      .catch(() => {});
  }, [sessionId]);

  async function send(text) {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const { data } = await sendChat({ sessionId, message: text });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        method: data.method
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error getting response.' }]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, send };
}
