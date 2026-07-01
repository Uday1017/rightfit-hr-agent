import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateEmail, sendEmail } from '../controllers/interviewController.js';

const router = Router();
router.use(protect);
router.post('/generate-email', generateEmail);
router.post('/send-email', sendEmail);

export default router;
