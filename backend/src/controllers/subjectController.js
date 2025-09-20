import Subject from "../models/Subject.js";

// ✅ Create Subject
export const createSubject = async (req, res) => {
  try {
    const { code, name, semester, departments } = req.body;

    const existing = await Subject.findOne({ code });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Subject code already exists" });
    }

    const subject = await Subject.create({ code, name, semester, departments });
    res.status(201).json({
      success: true,
      data: subject,
      message: "✅ Subject created successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get all Subjects (with optional department filter)
// ✅ Get all Subjects (with optional department + semester filter)
export const getSubjects = async (req, res) => {
  try {
    const { department, semester } = req.query;
    let filter = {};

    if (department) {
      // match department inside departments array
      filter.departments = department.toUpperCase();
    }

    if (semester) {
      filter.semester = Number(semester); // ensure numeric comparison
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
    const { code, name, semester, departments } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      id,
      { code, name, semester, departments },
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
