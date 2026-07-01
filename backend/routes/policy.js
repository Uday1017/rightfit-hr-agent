import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadPolicy, getPolicyDocs } from '../controllers/policyController.js';

const router = Router();
router.use(protect);
router.post('/upload', upload.array('policies', 10), uploadPolicy);
router.get('/docs/:sessionId', getPolicyDocs);

export default router;
