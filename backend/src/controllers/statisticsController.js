import mongoose from "mongoose";
import AttendanceSession from "../models/AttendanceSession.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";

// Helper: normalize batch
function normalizeBatch(batch) {
  if (!batch) return "Unknown";
  if (batch.toLowerCase() === "b1") return "B1";
  if (batch.toLowerCase() === "b2") return "B2";
  if (batch.toLowerCase() === "both") return "Both";
  return batch;
}

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

    // 2️⃣ Students in dept + sem (include batch)
    const students = await Student.find({
      department: department.toLowerCase(),
      semester: Number(semester),
    }).select("_id name registerNumber batch");

    // 3️⃣ Attendance records for these sessions
    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
    })
      .populate("studentId", "name phone registerNumber")
      .populate("sessionId", "date batch timeSlot duration");

    // 4️⃣ Build student → session history
    const studentMap = {};
    students.forEach((st) => {
      studentMap[st._id] = {
        _id: st._id,
        name: st.name,
        registerNumber: st.registerNumber,
        batch: normalizeBatch(st.batch), // ✅ batch included here
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
          duration: rec?.hours || s.duration || 1,
          batch: normalizeBatch(s.batch), // ✅ also attach batch for clarity
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

    const student = await Student.findOne({ clerkId: studentClerkId }).select(
      "_id name registerNumber batch department semester"
    );
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
    }).populate("sessionId", "date batch timeSlot duration");

    const history = sessions.map((s) => {
      const rec = records.find(
        (r) => r.sessionId._id.toString() === s._id.toString()
      );
      return {
        date: s.date,
        timeSlot: s.timeSlot,
        status: rec && rec.hours > 0 ? "Present" : "Absent",
        duration: rec?.hours || s.duration || 1,
        batch: normalizeBatch(student.batch), // ✅ include student's batch
      };
    });

    res.json({
      success: true,
      studentId,
      subjectId,
      batch: normalizeBatch(student.batch),
      sessions: history,
    });
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

    const student = await Student.findOne({ clerkId: req.user.id }).select(
      "department semester batch"
    );
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const subjects = await Subject.find({
      departments: student.department.toUpperCase(),
      semester: Number(student.semester),
    });

    res.json({
      success: true,
      batch: normalizeBatch(student.batch), // ✅ return batch too
      subjects,
    });
  } catch (err) {
    console.error("getMySubjects Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      error: err.message,
    });
  }
};
