import express from "express";
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Clerk-protected routes
router.post("/addsubject", authenticateUser, createSubject);
router.get("/getsubjects", authenticateUser, getSubjects); // /getsubjects?department=CSE
router.get("/getsubject/:id", authenticateUser, getSubjectById);
router.put("/updatesubject/:id", authenticateUser, updateSubject);
router.delete("/deletesubject/:id", authenticateUser, deleteSubject);

export default router;
