import express from "express";
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
} from "../controllers/attendanceSessionController.js";

const router = express.Router();

router.post("/", createSession); // Create session
router.get("/", getSessions); // Get sessions (with filters)
router.get("/:id", getSessionById); // Get single session + attendance
router.put("/:id", updateSession); // Update session
router.delete("/:id", deleteSession); // Delete session + records

export default router;
