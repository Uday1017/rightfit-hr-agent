export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function truncate(text, maxLen = 300) {
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}
