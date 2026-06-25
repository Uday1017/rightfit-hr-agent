import { useRef } from "react";

export default function FileUpload({ onFiles, accept = ".pdf,.txt", multiple = true }) {
  const ref = useRef();
  const handle = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFiles(files);
  };
  return (
    <div
      className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-all"
      onClick={() => ref.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onFiles(Array.from(e.dataTransfer.files)); }}
    >
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handle} />
      <p className="text-gray-400">Drop files here or <span className="text-indigo-400">browse</span></p>
      <p className="text-xs text-gray-600 mt-1">PDF or TXT, up to 10MB each</p>
    </div>
  );
}
