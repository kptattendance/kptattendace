import AttendanceSession from "../models/AttendanceSession.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Student from "../models/Student.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Subject from "../models/Subject.js";

export const createSession = async (req, res) => {
  try {
    let { lecturerId, subjectId, ...data } = req.body;

    // ✅ Convert Clerk ID → Mongo _id if needed
    if (lecturerId && !mongoose.Types.ObjectId.isValid(lecturerId)) {
      const foundUser = await User.findOne({ clerkId: lecturerId });
      if (!foundUser) {
        return res.status(400).json({
          message: `No matching Mongo user found for Clerk ID ${lecturerId}`,
        });
      }
      lecturerId = foundUser._id;
    }

    // ✅ Validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        message: `Subject not found for ID ${subjectId}`,
      });
    }

    // ✅ Check if a session already exists for the same date, time, and subject
    const existingSession = await AttendanceSession.findOne({
      date: data.date,
      timeSlot: data.timeSlot,
      subjectId,
      department: data.department,
      semester: data.semester,
    });

    if (existingSession) {
      return res.status(400).json({
        message: "A session already exists for this date and time slot ⚠️",
      });
    }

    // ✅ Create new session
    const session = await AttendanceSession.create({
      ...data,
      lecturerId,
      subjectId,
    });

    // ✅ Include subject name in response
    const responseData = {
      ...session.toObject(),
      subjectName: subject.name,
      subjectCode: subject.code,
    };

    res.status(201).json({
      message: "Session created successfully ✅",
      data: responseData,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(400).json({
      message: error.message || "Failed to create attendance session ❌",
    });
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

    // ✅ Fetch students for this dept+sem+batch
    let studentFilter = {
      department: session.department,
      semester: session.semester,
    };

    if (session.batch === "b1") {
      studentFilter.batch = "b1";
    } else if (session.batch === "b2") {
      studentFilter.batch = "b2";
    } else if (session.batch === "both") {
      studentFilter.batch = { $in: ["b1", "b2"] };
    }

    const students = await Student.find(studentFilter);

    // Also fetch attendance records
    const records = await AttendanceRecord.find({
      sessionId: session._id,
    }).populate("studentId");

    res.json({ session, students, records });
  } catch (err) {
    res
      .status(500)
      .json({ message: "❌ Failed to fetch session", error: err.message });
  }
};

// UPDATE session (safe)
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid session id" });
    }

    // clone request body so we can normalize/validate before saving
    const updateData = { ...req.body };

    // 1) If lecturerId provided, accept either:
    //    - Clerk id like "user_xxx" (map to User._id)
    //    - Mongo ObjectId string (use directly)
    if (updateData.lecturerId) {
      const incoming = String(updateData.lecturerId).trim();

      // Clerk id pattern (adjust if your clerk ids differ)
      if (incoming.startsWith("user_")) {
        const staff = await User.findOne({ clerkId: incoming });
        if (!staff) {
          return res
            .status(400)
            .json({ message: "Lecturer (Clerk id) not found in DB" });
        }
        updateData.lecturerId = staff._id; // ObjectId
      } else if (mongoose.isValidObjectId(incoming)) {
        // OK - already a Mongo id
        updateData.lecturerId = mongoose.Types.ObjectId(incoming);
      } else {
        return res.status(400).json({ message: "Invalid lecturerId format" });
      }
    }

    // 2) Normalize date if supplied (convert YYYY-MM-DD or string to Date)
    if (updateData.date) {
      const d = new Date(updateData.date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      updateData.date = d;
    }

    // 3) Normalize semester -> Number
    if (updateData.semester !== undefined) {
      const num = Number(updateData.semester);
      if (Number.isNaN(num)) {
        return res.status(400).json({ message: "Invalid semester value" });
      }
      updateData.semester = num;
    }

    // 5) Normalize batch if supplied
    if (updateData.batch) {
      const allowed = ["b1", "b2", "both"];
      if (!allowed.includes(updateData.batch)) {
        return res.status(400).json({ message: "Invalid batch value" });
      }
    }

    // 4) If subjectId present, ensure it looks like an ObjectId (optional but helpful)
    if (
      updateData.subjectId &&
      !mongoose.isValidObjectId(updateData.subjectId)
    ) {
      return res.status(400).json({ message: "Invalid subjectId" });
    }

    // Finally update (run validators)
    const updated = await AttendanceSession.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      context: "query",
    })
      .populate("subjectId", "code name")
      .populate("lecturerId", "name email department");

    if (!updated) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json({ message: "✅ Session updated", data: updated });
  } catch (err) {
    console.error("Update Session Error:", err); // important for debugging
    // If it's a CastError (invalid ObjectId) provide clearer feedback
    if (err.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Invalid value for a field", error: err.message });
    }
    return res
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
