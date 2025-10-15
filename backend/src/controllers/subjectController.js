import Subject from "../models/Subject.js";

// ✅ Create Subject
export const createSubject = async (req, res) => {
  try {
    const { code, name, semester, department } = req.body;

    // Check if the subject code already exists for the same department
    const existing = await Subject.findOne({
      code: code.toUpperCase(),
      department: department.toLowerCase(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Subject code "${code}" already exists for department "${department}"`,
      });
    }

    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      semester,
      department: department.toLowerCase(),
    });

    res.status(201).json({
      success: true,
      data: subject,
      message: "✅ Subject created successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get all Subjects (with optional department + semester filter)
export const getSubjects = async (req, res) => {
  try {
    const { role, department: hodDept } = req.user?.publicMetadata || {};
    let filter = {};

    // If HOD, restrict to their department (except Science)
    if (role === "hod" && hodDept && hodDept.toLowerCase() !== "sc") {
      filter.department = hodDept.toLowerCase();
    }

    // Optional query filtering
    if (req.query.department) {
      filter.department = req.query.department.toLowerCase();
    }

    if (req.query.semester) {
      filter.semester = Number(req.query.semester);
    }

    const subjects = await Subject.find(filter).sort({ semester: 1, code: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get single Subject by ID
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }
    res.json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update Subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, semester, department } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      id,
      {
        code: code.toUpperCase(),
        name,
        semester,
        department: department.toLowerCase(),
      },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    res.json({
      success: true,
      data: subject,
      message: "✅ Subject updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete Subject
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    res.json({ success: true, message: "✅ Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
