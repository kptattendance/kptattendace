import mongoose from "mongoose";
import AttendanceSession from "../models/AttendanceSession.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";

// 🔹 Staff: Subject-wise detailed attendance (all students)
export const getSubjectWiseAttendanceDetails = async (req, res) => {
  try {
    const { department, semester, subjectId } = req.query;

    if (!department || !semester || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "department, semester and subjectId are required",
      });
    }

    const subjectObjectId = new mongoose.Types.ObjectId(subjectId);

    // 1️⃣ Sessions of subject
    const sessions = await AttendanceSession.find({
      department: department.toLowerCase(),
      semester: Number(semester),
      subjectId: subjectObjectId,
    }).sort({ date: 1 });

    if (!sessions.length) return res.json({ success: true, data: [] });

    const sessionIds = sessions.map((s) => s._id);

    // 2️⃣ Students in dept + sem
    const students = await Student.find({
      department: department.toLowerCase(),
      semester: Number(semester),
    }).select("_id name registerNumber");

    // 3️⃣ Attendance records for these sessions
    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
    })
      .populate("studentId", "name registerNumber")
      .populate("sessionId", "date timeSlot");

    // 4️⃣ Build student → session history
    const studentMap = {};
    students.forEach((st) => {
      studentMap[st._id] = {
        _id: st._id,
        name: st.name,
        registerNumber: st.registerNumber,
        sessions: [], // { date, timeSlot, status }
      };
    });

    sessions.forEach((s) => {
      students.forEach((st) => {
        const rec = records.find(
          (r) =>
            r.studentId?._id?.toString() === st._id.toString() &&
            r.sessionId?._id?.toString() === s._id.toString()
        );

        studentMap[st._id].sessions.push({
          date: s.date,
          timeSlot: s.timeSlot,
          status: rec && rec.hours > 0 ? "Present" : "Absent",
        });
      });
    });

    res.json({ success: true, data: Object.values(studentMap) });
  } catch (err) {
    console.error("getSubjectWiseAttendanceDetails Error:", err);
    res.status(500).json({
      success: false,
      message: "❌ Failed to fetch attendance details",
      error: err.message,
    });
  }
};

// 🔹 Student: Subject-wise detailed attendance (only for logged-in student)
export const getMySubjectAttendanceDetails = async (req, res) => {
  try {
    const studentClerkId = req.user?.id;
    if (!studentClerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { subjectId } = req.query;
    if (!subjectId) {
      return res
        .status(400)
        .json({ success: false, message: "subjectId is required" });
    }

    const student = await Student.findOne({ clerkId: studentClerkId });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const studentId = student._id;

    // Fetch sessions
    const sessions = await AttendanceSession.find({ subjectId }).sort({
      date: 1,
    });
    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
      studentId,
    }).populate("sessionId", "date timeSlot");

    const history = sessions.map((s) => {
      const rec = records.find(
        (r) => r.sessionId._id.toString() === s._id.toString()
      );
      return {
        date: s.date,
        timeSlot: s.timeSlot,
        status: rec && rec.hours > 0 ? "Present" : "Absent",
        duration: rec?.hours || 0,
      };
    });

    res.json({ success: true, studentId, subjectId, sessions: history });
  } catch (err) {
    console.error("getMySubjectAttendanceDetails Error:", err);
    res.status(500).json({
      success: false,
      message: "❌ Failed to fetch student attendance details",
      error: err.message,
    });
  }
};

// 🔹 Fetch subjects for logged-in student
export const getMySubjects = async (req, res) => {
  try {
    const studentId = req.user?.id; // Clerk ID
    if (!studentId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const student = await Student.findOne({ clerkId: req.user.id });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const subjects = await Subject.find({
      departments: student.department.toUpperCase(),
      semester: Number(student.semester),
    });

    res.json({ success: true, subjects });
  } catch (err) {
    console.error("getMySubjects Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      error: err.message,
    });
  }
};
