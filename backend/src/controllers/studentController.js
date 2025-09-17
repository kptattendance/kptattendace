// src/controllers/studentController.js
import Student from "../models/Student.js";
import cloudinary from "../config/cloudinary.js";
import { clerkClient } from "@clerk/express";

// CREATE student
// CREATE student
export const createStudent = async (req, res) => {
  try {
    const { role, department: hodDept } = req.user;
    const { registerNumber, name, email, phone, department, semester } =
      req.body;

    if (role !== "admin" && role !== "hod") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to add students" });
    }

    if (role === "hod") {
      if (hodDept === "sc") {
        return res
          .status(403)
          .json({ success: false, message: "Science HOD cannot add students" });
      }
      if (department !== hodDept) {
        return res.status(403).json({
          success: false,
          message: "You can only add students from your department",
        });
      }
    }

    // ✅ Clerk account with role + department
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName: name,
      publicMetadata: {
        role: "student",
        department, // 👈 add department here
      },
    });

    // Save MongoDB doc
    const student = new Student({
      registerNumber,
      name,
      email,
      phone,
      department,
      semester,
      role: "student",
      clerkId: clerkUser.id,
      imageUrl: req.cloudinaryResult?.secure_url,
      imagePublicId: req.cloudinaryResult?.public_id,
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: student,
    });
  } catch (err) {
    console.error("CreateStudent Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add student. Please try again later.",
    });
  }
};

// GET all students
export const getStudents = async (req, res) => {
  try {
    const { role, department } = req.user;

    let students;
    if (role === "admin") {
      students = await Student.find().sort({ createdAt: -1 });
    } else if (role === "hod") {
      if (department === "sc") {
        students = await Student.find().sort({ createdAt: -1 }); // science HOD sees all
      } else {
        students = await Student.find({ department }).sort({ createdAt: -1 });
      }
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to view students" });
    }

    res.json({ success: true, data: students });
  } catch (err) {
    console.error("GetStudents Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch students.",
    });
  }
};

// UPDATE student
export const updateStudent = async (req, res) => {
  try {
    const { role, department } = req.user;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (
      role === "hod" &&
      department !== "sc" &&
      student.department !== department
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit student outside your department",
      });
    }
    if (role === "hod" && department === "sc") {
      return res.status(403).json({
        success: false,
        message: "Science HOD cannot modify students",
      });
    }

    const updateData = { ...req.body };

    if (req.cloudinaryResult) {
      updateData.imageUrl = req.cloudinaryResult.secure_url;
      updateData.imagePublicId = req.cloudinaryResult.public_id;
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: "Student updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("UpdateStudent Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update student.",
    });
  }
};

// DELETE student
export const deleteStudent = async (req, res) => {
  try {
    const { role, department } = req.user;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    if (role === "hod" && student.department !== department) {
      return res.status(403).json({
        success: false,
        message: "HOD cannot delete student from another department.",
      });
    }

    if (role === "hod" && department === "sc") {
      return res.status(403).json({
        success: false,
        message: "Science HOD cannot modify students",
      });
    }

    // 1. Delete Clerk user
    if (student.clerkId) {
      await clerkClient.users.deleteUser(student.clerkId);
    }

    // 2. Delete Cloudinary image
    if (student.imagePublicId) {
      await cloudinary.uploader.destroy(student.imagePublicId);
    }

    // 3. Delete MongoDB doc
    await student.deleteOne();

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("DeleteStudent Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete student.",
    });
  }
};

// GET student by ID
export const getStudentById = async (req, res) => {
  try {
    const { role, department } = req.user;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // ✅ Role-based access checks
    if (
      role === "hod" &&
      department !== "sc" &&
      student.department !== department
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view students from your own department",
      });
    }

    if (role !== "admin" && role !== "hod") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to view student" });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    console.error("GetStudentById Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch student details.",
    });
  }
};
