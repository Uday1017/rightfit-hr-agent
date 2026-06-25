export function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  let id = 0;
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start) end = lastNewline;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push({ id: id++, text: chunk, start, end });
    start = end - overlap;
  }
  return chunks;
}
