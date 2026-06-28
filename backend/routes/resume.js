import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { uploadResumes, rankCandidates, getSessionResumes } from "../controllers/resumeController.js";

const router = Router();
router.post("/upload", upload.array("resumes", 20), uploadResumes);
router.post("/rank", rankCandidates);
router.get("/session/:sessionId", getSessionResumes);

export default router;
