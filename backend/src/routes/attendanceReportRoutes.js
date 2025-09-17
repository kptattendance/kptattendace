import express from "express";
import {
  getStudentSubjectReport,
  getClassSubjectReport,
  getOverallStudentReport,
} from "../controllers/attendanceReportController.js";

const router = express.Router();

router.get("/student-subject", getStudentSubjectReport); // Student % in subject
router.get("/class-subject", getClassSubjectReport); // Class % per subject
router.get("/student-overall", getOverallStudentReport); // Student across all subjects

export default router;
