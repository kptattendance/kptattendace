import express from "express";
import {
  getSubjectWiseAttendanceDetails,
  getMySubjectAttendanceDetails,
  getMySubjects,
} from "../controllers/statisticsController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Staff route
router.get("/subject-wise", getSubjectWiseAttendanceDetails);

// Student routes – must use auth middleware
router.get("/my-subject-wise", authenticateUser, getMySubjectAttendanceDetails);
router.get("/my-subjects", authenticateUser, getMySubjects);

export default router;
