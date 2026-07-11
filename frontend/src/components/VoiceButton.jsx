import { useVoice } from "../hooks/useVoice.js";

export default function VoiceButton({ onTranscript }) {
  const { listening, start, stop } = useVoice(onTranscript);
  return (
    <button
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      className={`p-2 sm:p-2.5 rounded-full transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${listening ? "bg-red-500 animate-pulse" : "bg-gray-700 hover:bg-gray-600"}`}
      title="Hold to speak"
      aria-label="Voice input - hold to speak"
    >
      <span className="text-base sm:text-lg">🎤</span>
    </button>
  );
}
