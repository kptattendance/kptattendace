import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      default: "present",
    },
    hours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("AttendanceRecord", attendanceRecordSchema);
