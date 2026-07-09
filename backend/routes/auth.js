import { Router } from 'express';
import { register, login, me, saveApiKey, getApiKey } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.post('/api-key', protect, saveApiKey);
router.get('/api-key', protect, getApiKey);

export default router;
