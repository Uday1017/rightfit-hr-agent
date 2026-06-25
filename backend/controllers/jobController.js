import { generate } from '../services/geminiService.js';

export async function generateJD(req, res, next) {
  try {
    const { title, level, skills } = req.body;
    const prompt = `Write a professional job description for: ${title} (${level || 'Mid-level'})
${skills ? `Key skills: ${skills}` : ''}
Include: role summary, 6 responsibilities, 6 requirements, nice-to-haves.
Keep it concise and professional.`;
    const jd = await generate(prompt);
    res.json({ jd });
  } catch (err) {
    next(err);
  }
}
