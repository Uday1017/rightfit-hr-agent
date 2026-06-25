import { useVoice } from "../hooks/useVoice.js";

export default function VoiceButton({ onTranscript }) {
  const { listening, start, stop } = useVoice(onTranscript);
  return (
    <button
      onMouseDown={start}
      onMouseUp={stop}
      className={`p-2 rounded-full transition-all ${listening ? "bg-red-500 animate-pulse" : "bg-gray-700 hover:bg-gray-600"}`}
      title="Hold to speak"
    >
      🎤
    </button>
  );
}
