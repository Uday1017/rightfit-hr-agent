import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { uploadResumes, rankCandidates } from "../controllers/resumeController.js";

const router = Router();
router.post("/upload", upload.array("resumes", 20), uploadResumes);
router.post("/rank", rankCandidates);

export default router;
