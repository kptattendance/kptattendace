import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSession from "../models/AttendanceSession.js";
import mongoose from "mongoose";

// ✅ Helper to calculate percentage
const calcPercentage = (present, total) =>
  total === 0 ? 0 : ((present / total) * 100).toFixed(2);

// ✅ Report: Student’s attendance for a subject
export const getStudentSubjectReport = async (req, res) => {
  try {
    const { studentId, subjectId, startDate, endDate } = req.query;

    const filter = { studentId };
    if (subjectId) filter["sessionId"] = { $exists: true };

    // Sessions filter
    const sessionFilter = { _id: { $exists: true } };
    if (subjectId)
      sessionFilter.subjectId = new mongoose.Types.ObjectId(subjectId);
    if (startDate && endDate) {
      sessionFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sessions = await AttendanceSession.find(sessionFilter).select("_id");
    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({
      studentId,
      sessionId: { $in: sessionIds },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;

    res.json({
      totalClasses: total,
      present,
      absent: total - present,
      percentage: calcPercentage(present, total),
      records,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to fetch report", error: err.message });
  }
};

// ✅ Report: Subject-wise attendance for all students (class-level)
export const getClassSubjectReport = async (req, res) => {
  try {
    const { subjectId, semester, department, startDate, endDate } = req.query;

    // Find relevant sessions
    const sessionFilter = { subjectId };
    if (semester) sessionFilter.semester = semester;
    if (department) sessionFilter.department = department;
    if (startDate && endDate) {
      sessionFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sessions = await AttendanceSession.find(sessionFilter).select("_id");
    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
    }).populate("studentId");

    // Group by student
    const report = {};
    records.forEach((r) => {
      const sid = r.studentId._id.toString();
      if (!report[sid]) {
        report[sid] = {
          student: r.studentId,
          total: 0,
          present: 0,
        };
      }
      report[sid].total++;
      if (r.status === "present") report[sid].present++;
    });

    // Format output
    const data = Object.values(report).map((r) => ({
      student: r.student,
      totalClasses: r.total,
      present: r.present,
      absent: r.total - r.present,
      percentage: calcPercentage(r.present, r.total),
    }));

    res.json({ subjectId, data });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to fetch class report", error: err.message });
  }
};

// ✅ Report: Overall student attendance across all subjects
export const getOverallStudentReport = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;

    const filter = { studentId };
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const records = await AttendanceRecord.find(filter).populate({
      path: "sessionId",
      populate: { path: "subjectId", select: "name code" },
    });

    // Group by subject
    const report = {};
    records.forEach((r) => {
      const subId = r.sessionId.subjectId._id.toString();
      if (!report[subId]) {
        report[subId] = {
          subject: r.sessionId.subjectId,
          total: 0,
          present: 0,
        };
      }
      report[subId].total++;
      if (r.status === "present") report[subId].present++;
    });

    const data = Object.values(report).map((r) => ({
      subject: r.subject,
      totalClasses: r.total,
      present: r.present,
      absent: r.total - r.present,
      percentage: calcPercentage(r.present, r.total),
    }));

    res.json({ studentId, data });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "❌ Failed to fetch overall report",
        error: err.message,
      });
  }
};
