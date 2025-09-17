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

// ✅ Get all Subjects (with department filter based on user role)
export const getSubjects = async (req, res) => {
  try {
    const { department } = req.query;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    let filter = {};
    
    // If user is HOD, only show subjects from their department
    if (userRole === 'hod' && userDepartment) {
      filter.departments = userDepartment.toUpperCase();
    } 
    // If department query parameter is provided (for admins)
    else if (department) {
      filter.departments = department.toUpperCase();
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
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // First find the subject to check permissions
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    // If user is HOD, check if the subject belongs to their department
    if (userRole === 'hod') {
      if (!userDepartment || !existingSubject.departments.includes(userDepartment.toUpperCase())) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized: You can only update subjects from your department" 
        });
      }
      
      // Prevent HOD from changing the department of a subject
      if (JSON.stringify(departments) !== JSON.stringify(existingSubject.departments)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You cannot change the department of a subject"
        });
      }
    }

    const subject = await Subject.findByIdAndUpdate(
      id,
      { code, name, semester, departments },
      { new: true, runValidators: true }
    );

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
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // First find the subject to check permissions
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    // If user is HOD, check if the subject belongs to their department
    if (userRole === 'hod') {
      if (!userDepartment || !subject.departments.includes(userDepartment.toUpperCase())) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized: You can only delete subjects from your department" 
        });
      }
    }

    await Subject.findByIdAndDelete(id);
    res.json({ success: true, message: "✅ Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
