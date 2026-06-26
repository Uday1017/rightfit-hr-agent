import express from 'express';
import { chat, getChatHistory } from '../controllers/chatController.js';

const router = express.Router();
router.post('/', chat);
router.get('/history/:sessionId', getChatHistory);
export default router;
