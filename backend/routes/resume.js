import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadResumes, rankCandidates, getSessionResumes, getUserSessions, createSession, deleteResume, renameSession, getJobStatus } from "../controllers/resumeController.js";

const router = Router();
router.use(protect);
router.get("/sessions", getUserSessions);
router.post("/sessions", createSession);
router.patch("/sessions/:sessionId", renameSession);
router.get("/session/:sessionId", getSessionResumes);
router.delete("/session/:sessionId/resume/:resumeId", deleteResume);
router.post("/upload", upload.array("resumes", 20), uploadResumes);
router.get("/job/:jobId/status", getJobStatus);
router.post("/rank", rankCandidates);

export default router;
