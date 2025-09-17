import express from "express";
import {
  markAttendance,
  getStudentAttendance,
  getSessionAttendance,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceRecordController.js";

const router = express.Router();

router.post("/", markAttendance); // Bulk mark/update
router.get("/student/:studentId", getStudentAttendance); // Student’s full attendance
router.get("/session/:sessionId", getSessionAttendance); // Attendance for session
router.put("/", updateAttendance); // Update one student
router.delete("/:id", deleteAttendance); // Delete one record

export default router;
