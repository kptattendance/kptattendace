import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    semester: { type: Number, required: true },
    department: { type: String, required: true },
    duration: { type: Number, required: true, default: 1 },

    // ✅ NEW FIELD
    batch: {
      type: String,
      enum: ["b1", "b2", "both"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceSession", attendanceSessionSchema);
