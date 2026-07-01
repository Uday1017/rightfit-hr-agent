import nodemailer from 'nodemailer';
import { generate } from '../services/geminiService.js';
import { createTrace } from '../utils/langfuse.js';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function generateEmail(req, res, next) {
  try {
    const { candidateName, role, interviewDate, interviewTime, meetLink, recruiterName, companyName } = req.body;

    const prompt = `You are an HR professional writing a warm, professional interview invitation email.

Write a congratulations email to ${candidateName} who has been shortlisted for the ${role} position at ${companyName}.

Details:
- Interview Date: ${interviewDate}
- Interview Time: ${interviewTime}
- Google Meet Link: ${meetLink || 'To be shared separately'}
- Recruiter Name: ${recruiterName}

The email should:
1. Congratulate them on being shortlisted
2. Mention the interview date, time, and Meet link clearly
3. Ask them to confirm attendance by replying
4. Be warm but professional
5. End with the recruiter's name and company

Return ONLY the email body text, no subject line, no markdown.`;

    const trace = createTrace('interview.generateEmail', { candidateName, role });
    const emailBody = await generate(prompt, trace, 'email.generate');

    const subject = `Interview Invitation — ${role} at ${companyName}`;
    res.json({ subject, emailBody });
  } catch (err) { next(err); }
}

export async function sendEmail(req, res, next) {
  try {
    const { to, subject, emailBody, candidateName } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({ error: 'Email credentials not configured in .env' });
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${req.body.recruiterName || 'RightFit HR'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br/>'),
    });

    console.log(`[Interview] Email sent to ${to} for ${candidateName}`);
    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error('[Interview] Email error:', err.message);
    next(err);
  }
}
