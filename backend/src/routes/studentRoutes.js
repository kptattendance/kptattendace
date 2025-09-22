import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  searchStudents,
  getStudentAttendanceHistory,
  bulkAddStudents,
} from "../controllers/studentController.js";

import { authenticateUser } from "../middlewares/authMiddleware.js";
import { uploadSingleImage } from "../middlewares/uploadImage.js"; // ✅ fixed path

const router = express.Router();

// All routes require Clerk auth
router.use(authenticateUser);

// Add student
router.post("/addstudent", uploadSingleImage, createStudent);

// Get students
router.get("/getstudents", getStudents);

// Get student by id
router.get("/getstudent/:id", getStudentById);

// Update student
router.put("/updatestudent/:id", uploadSingleImage, updateStudent);

// Delete student
router.delete("/deletestudent/:id", deleteStudent);
router.get("/search", searchStudents);
router.get("/student-history", getStudentAttendanceHistory);

router.post("/bulk-add", bulkAddStudents);
export default router;
