import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8, // assuming 8 semesters
    },
    departments: [
      {
        type: String, // e.g. "cs", "ec", "me"
        required: true,
        trim: true,
        uppercase: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
