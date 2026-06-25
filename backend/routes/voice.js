import express from 'express';
const router = express.Router();
// Voice is handled browser-side via Web Speech API
router.get('/status', (req, res) => res.json({ status: 'Voice handled client-side' }));
export default router;
