import express from 'express';
import { generateJD } from '../controllers/jobController.js';

const router = express.Router();
router.post('/generate-jd', generateJD);
export default router;
