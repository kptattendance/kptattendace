import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    registerNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    role: { type: String, default: "student" },

    // Cloudinary image
    imageUrl: { type: String },
    imagePublicId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
