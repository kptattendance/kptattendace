import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSession from "../models/AttendanceSession.js";
import mongoose from "mongoose";

// ✅ Helper to calculate percentage
const calcPercentage = (attended, total) =>
  total === 0 ? 0 : ((attended / total) * 100).toFixed(2);

// ✅ Student’s attendance for a subject
export const getStudentSubjectReport = async (req, res) => {
  try {
    const { studentId, subjectId, startDate, endDate } = req.query;

    const sessionFilter = {};
    if (subjectId)
      sessionFilter.subjectId = new mongoose.Types.ObjectId(subjectId);
    if (startDate && endDate) {
      sessionFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sessions =
      await AttendanceSession.find(sessionFilter).select("_id timeSlot");
    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({
      studentId,
      sessionId: { $in: sessionIds },
    }).populate("sessionId", "timeSlot");

    let totalHours = 0;
    let attendedHours = 0;

    sessions.forEach((s) => {
      const [start, end] = s.timeSlot.split("-");
      const sd = new Date(`2000-01-01T${start}:00`);
      const ed = new Date(`2000-01-01T${end}:00`);
      totalHours += (ed - sd) / (1000 * 60 * 60);
    });

    attendedHours = records.reduce((sum, r) => sum + (r.hours || 0), 0);

    res.json({
      totalHours,
      attendedHours,
      absentHours: totalHours - attendedHours,
      percentage: calcPercentage(attendedHours, totalHours),
      records,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to fetch report", error: err.message });
  }
};

// ✅ Subject-wise attendance for all students (class-level)
// ✅ Subject-wise attendance for all students (class-level)
export const getClassSubjectReport = async (req, res) => {
  try {
    const { subjectId, semester, department, startDate, endDate, month } =
      req.query;

    console.log("🔎 Query Params:", {
      subjectId,
      semester,
      department,
      startDate,
      endDate,
      month,
    });

    const sessionFilter = {};
    if (subjectId) {
      try {
        sessionFilter.subjectId = new mongoose.Types.ObjectId(subjectId);
      } catch (e) {
        console.error("❌ Invalid subjectId format:", subjectId);
        return res
          .status(400)
          .json({ message: "Invalid subjectId format", subjectId });
      }
    }
    if (semester) sessionFilter.semester = Number(semester);

    if (month) {
      const year = new Date().getFullYear();
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0, 23, 59, 59);
      sessionFilter.date = { $gte: firstDay, $lte: lastDay };
    }
    if (startDate && endDate) {
      sessionFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    console.log("📝 Session Filter:", sessionFilter);

    let sessions = await AttendanceSession.find(sessionFilter)
      .populate("subjectId", "name code semester departments timeSlot")
      .select("_id subjectId timeSlot date department");

    console.log("📌 Sessions Found:", sessions.length);

    // 🔹 Extra filter by department if needed
    if (department) {
      sessions = sessions.filter((s) => {
        const depts = (s.subjectId.departments || []).map((d) =>
          d.toLowerCase()
        );
        return depts.includes(department.toLowerCase());
      });
      console.log("📌 Sessions after dept filter:", sessions.length);
    }

    if (sessions.length === 0) {
      console.warn("⚠️ No sessions found for given filter");
      return res.json({ data: [] });
    }

    const sessionIds = sessions.map((s) => s._id);
    console.log("🆔 Session IDs:", sessionIds.length);

    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
    }).populate(
      "studentId",
      "name registerNumber phone semester department imageUrl"
    );

    console.log("📌 Attendance Records Found:", records.length);

    // Group by subject
    const subjectMap = {};
    sessions.forEach((s) => {
      if (!s.timeSlot) {
        console.warn("⚠️ Session missing timeSlot:", s._id);
        return;
      }
      const sid = s.subjectId._id.toString();
      const [start, end] = s.timeSlot.split("-");
      const sd = new Date(`2000-01-01T${start}:00`);
      const ed = new Date(`2000-01-01T${end}:00`);
      const duration = (ed - sd) / (1000 * 60 * 60);

      if (!subjectMap[sid]) {
        subjectMap[sid] = {
          subject: s.subjectId,
          totalHours: 0,
          students: {},
        };
      }
      subjectMap[sid].totalHours += duration;
    });

    records.forEach((r) => {
      const session = sessions.find(
        (s) => s._id.toString() === r.sessionId.toString()
      );
      if (!session) {
        console.warn("⚠️ Record with no matching session:", r._id);
        return;
      }

      const subjId = session.subjectId._id.toString();
      const studentId = r.studentId?._id?.toString();

      if (!studentId) {
        console.warn("⚠️ Record missing studentId:", r._id);
        return;
      }

      if (!subjectMap[subjId].students[studentId]) {
        subjectMap[subjId].students[studentId] = {
          _id: r.studentId._id,
          semester: r.studentId.semester,
          registerNumber: r.studentId.registerNumber,
          phone: r.studentId.phone,
          name: r.studentId.name,
          imageUrl: r.studentId.imageUrl,
          attendedHours: 0,
        };
      }

      subjectMap[subjId].students[studentId].attendedHours += r.hours || 0;
    });

    const data = Object.values(subjectMap).map((s) => ({
      subject: s.subject,
      semester: s.subject.semester,
      departments: s.subject.departments,
      totalHours: s.totalHours,
      students: Object.values(s.students).map((st) => ({
        ...st,
        percentage: calcPercentage(st.attendedHours, s.totalHours),
      })),
    }));

    console.log("✅ Final Data:", JSON.stringify(data, null, 2));

    res.json({ data });
  } catch (err) {
    console.error("❌ getClassSubjectReport Error:", err);
    res
      .status(500)
      .json({ message: "❌ Failed to fetch class report", error: err.message });
  }
};


// ✅ Overall student attendance across all subjects
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
      populate: { path: "subjectId", select: "name code timeSlot" },
    });

    const report = {};
    records.forEach((r) => {
      const subj = r.sessionId.subjectId;
      const subId = subj._id.toString();

      const [start, end] = r.sessionId.timeSlot.split("-");
      const sd = new Date(`2000-01-01T${start}:00`);
      const ed = new Date(`2000-01-01T${end}:00`);
      const duration = (ed - sd) / (1000 * 60 * 60);

      if (!report[subId]) {
        report[subId] = {
          subject: subj,
          totalHours: 0,
          attendedHours: 0,
        };
      }

      report[subId].totalHours += duration;
      report[subId].attendedHours += r.hours || 0;
    });

    const data = Object.values(report).map((r) => ({
      subject: r.subject,
      totalHours: r.totalHours,
      attendedHours: r.attendedHours,
      absentHours: r.totalHours - r.attendedHours,
      percentage: calcPercentage(r.attendedHours, r.totalHours),
    }));

    res.json({ studentId, data });
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to fetch overall report",
      error: err.message,
    });
  }
};
