import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadResumes, rankCandidates, getSessionResumes, getUserSessions, createSession } from "../controllers/resumeController.js";

const router = Router();
router.use(protect);
router.get("/sessions", getUserSessions);
router.post("/sessions", createSession);
router.get("/session/:sessionId", getSessionResumes);
router.post("/upload", upload.array("resumes", 20), uploadResumes);
router.post("/rank", rankCandidates);

export default router;
