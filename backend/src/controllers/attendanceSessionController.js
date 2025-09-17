import AttendanceSession from "../models/AttendanceSession.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Student from "../models/Student.js";

// ✅ Create a new attendance session
export const createSession = async (req, res) => {
  try {
    const { date, timeSlot, subjectId, lecturerId, semester, department } =
      req.body;

    // Prevent duplicate session (same date, slot, subject, semester, department, lecturer)
    const exists = await AttendanceSession.findOne({
      date,
      timeSlot,
      subjectId,
      semester,
      department,
      lecturerId,
    });

    if (exists) {
      return res
        .status(400)
        .json({ message: "⚠️ Session already exists for this slot" });
    }

    const session = await AttendanceSession.create({
      date,
      timeSlot,
      subjectId,
      lecturerId,
      semester,
      department,
    });

    res.status(201).json({ message: "✅ Session created", data: session });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to create session", error: err.message });
  }
};

// ✅ Get all sessions (with optional filters)
export const getSessions = async (req, res) => {
  try {
    const { date, subjectId, lecturerId, semester, department } = req.query;

    const filter = {};
    if (date) filter.date = date;
    if (subjectId) filter.subjectId = subjectId;
    if (lecturerId) filter.lecturerId = lecturerId;
    if (semester) filter.semester = semester;
    if (department) filter.department = department;

    const sessions = await AttendanceSession.find(filter)
      .populate("subjectId", "code name")
      .populate("lecturerId", "name email");

    res.json({ data: sessions });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to fetch sessions", error: err.message });
  }
};

// ✅ Get single session + attendance records
export const getSessionById = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate("subjectId", "code name")
      .populate("lecturerId", "name email");

    if (!session) return res.status(404).json({ message: "Session not found" });

    const records = await AttendanceRecord.find({
      sessionId: session._id,
    }).populate("studentId");

    res.json({ session, records });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to fetch session", error: err.message });
  }
};

// ✅ Update session (e.g., wrong subject/time corrected)
export const updateSession = async (req, res) => {
  try {
    const updated = await AttendanceSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Session not found" });

    res.json({ message: "✅ Session updated", data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to update session", error: err.message });
  }
};

// ✅ Delete session (cascade delete attendance records)
export const deleteSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    await AttendanceRecord.deleteMany({ sessionId: session._id });
    await session.deleteOne();

    res.json({ message: "🗑️ Session & records deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to delete session", error: err.message });
  }
};
