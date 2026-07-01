import fs from 'fs';
import path from 'path';
import { extractTextFromPDF, extractTextFromTxt } from '../services/ocrService.js';
import { embedAndStoreDocument } from '../services/embeddingService.js';
import { cleanText } from '../utils/helpers.js';
import { getSessionDocs } from '../utils/vectorStore.js';

export async function uploadPolicy(req, res, next) {
  try {
    const { sessionId } = req.body;
    const files = req.files;

    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const results = [];

    for (const file of files) {
      console.log(`[Policy] Processing: ${file.originalname}`);
      const ext = path.extname(file.originalname).toLowerCase();

      let rawText = '';
      if (ext === '.pdf') rawText = await extractTextFromPDF(file.path);
      else if (ext === '.txt') rawText = extractTextFromTxt(file.path);

      const text = cleanText(rawText);
      console.log(`[Policy] Extracted ${text.length} chars`);

      await embedAndStoreDocument(sessionId, req.user?.id, file.originalname, text, 'policy');

      try { fs.unlinkSync(file.path); } catch {}

      results.push({ filename: file.originalname, chunks: Math.ceil(text.length / 500) });
    }

    res.json({ success: true, files: results });
  } catch (err) {
    console.error('[Policy] Error:', err.message);
    next(err);
  }
}

export async function getPolicyDocs(req, res, next) {
  try {
    const { sessionId } = req.params;
    const allDocs = await getSessionDocs(sessionId);
    res.json({ docs: allDocs });
  } catch (err) { next(err); }
}
