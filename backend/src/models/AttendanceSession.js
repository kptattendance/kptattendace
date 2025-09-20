import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g. "10:00-11:00"
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // who taught
    semester: { type: Number, required: true },
    department: { type: String, required: true }, // e.g., "cs"
    duration: { type: Number, required: true, default: 1 },
  },

  { timestamps: true }
);

export default mongoose.model("AttendanceSession", attendanceSessionSchema);
