import AttendanceRecord from "../models/AttendanceRecord.js";
import AttendanceSession from "../models/AttendanceSession.js";

// ✅ Mark attendance for a session
export const markAttendance = async (req, res) => {
  try {
    const { sessionId, records } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "❌ Session not found" });
    }

    // Calculate hours for this session
    const [start, end] = session.timeSlot.split("-");
    const sd = new Date(`2000-01-01T${start}:00`);
    const ed = new Date(`2000-01-01T${end}:00`);
    const duration = (ed - sd) / (1000 * 60 * 60);

    const bulkOps = records.map((r) => ({
      updateOne: {
        filter: { sessionId, studentId: r.studentId },
        update: {
          $set: {
            status: r.status,
            hours: r.status === "present" ? duration : 0,
          },
        },
        upsert: true,
      },
    }));

    await AttendanceRecord.bulkWrite(bulkOps);

    res.json({ message: "✅ Attendance marked/updated" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to mark attendance", error: err.message });
  }
};

// ✅ Get all attendance for a student
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await AttendanceRecord.find({ studentId }).populate(
      "sessionId"
    );
    res.json({ data: records });
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to fetch student attendance",
      error: err.message,
    });
  }
};

// ✅ Get all attendance for a session
export const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const records = await AttendanceRecord.find({ sessionId }).populate(
      "studentId"
    );
    res.json({ data: records });
  } catch (err) {
    res.status(500).json({
      message: "❌ Failed to fetch session attendance",
      error: err.message,
    });
  }
};

// ✅ Update one student's status in a session
export const updateAttendance = async (req, res) => {
  try {
    const { sessionId, studentId, status } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "❌ Session not found" });
    }

    const [start, end] = session.timeSlot.split("-");
    const sd = new Date(`2000-01-01T${start}:00`);
    const ed = new Date(`2000-01-01T${end}:00`);
    const duration = (ed - sd) / (1000 * 60 * 60);

    const record = await AttendanceRecord.findOneAndUpdate(
      { sessionId, studentId },
      { status, hours: status === "present" ? duration : 0 },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Attendance updated", data: record });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to update attendance", error: err.message });
  }
};

// ✅ Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    await AttendanceRecord.findByIdAndDelete(req.params.id);
    res.json({ message: "🗑️ Attendance record deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to delete attendance", error: err.message });
  }
};
