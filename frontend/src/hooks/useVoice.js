import { useState, useRef } from "react";

export function useVoice(onTranscript) {
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);

  function start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognition.current = new SR();
    recognition.current.lang = "en-US";
    recognition.current.onresult = (e) => onTranscript(e.results[0][0].transcript);
    recognition.current.start();
    setListening(true);
  }

  function stop() {
    recognition.current?.stop();
    setListening(false);
  }

  return { listening, start, stop };
}
