import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();
router.get('/', protect, getAnalytics);

export default router;
