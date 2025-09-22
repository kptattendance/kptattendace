"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, Upload } from "lucide-react";
import LoaderOverlay from "../LoaderOverlay";

export default function AdminStudentList() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const role = user?.publicMetadata?.role;
  const hodDepartment = user?.publicMetadata?.department;

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);

  // ✅ Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    registerNumber: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    semester: "",
    batch: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);

  // ✅ Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all"); // ✅ Department filter
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // ✅ Departments list
  const departments = [
    { value: "all", label: "All Departments" },
    { value: "at", label: "Automobile Engineering" },
    { value: "ch", label: "Chemical Engineering" },
    { value: "ce", label: "Civil Engineering" },
    { value: "cs", label: "Computer Science Engineering" },
    { value: "ec", label: "Electronics & Communication Engineering" },
    { value: "eee", label: "Electrical & Electronics Engineering" },
    { value: "me", label: "Mechanical Engineering" },
    { value: "po", label: "Polymer Engineering" },
    { value: "sc", label: "Science and English" },
  ];

  // ✅ Helper: sort by register number
  const sortByRegisterNumber = (arr) => {
    return [...arr].sort((a, b) =>
      a.registerNumber.localeCompare(b.registerNumber, "en", {
        numeric: true,
        sensitivity: "base",
      })
    );
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let data = res.data.data;

      // ✅ Restrict HODs to their own department (except Science)
      if (role === "hod" && hodDepartment !== "sc") {
        data = data.filter((s) => s.department === hodDepartment);
      }

      setStudents(sortByRegisterNumber(data));
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("❌ Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ✅ Apply filters
  useEffect(() => {
    let data = [...students];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.registerNumber.toLowerCase().includes(lower) ||
          s.email.toLowerCase().includes(lower)
      );
    }

    if (yearFilter !== "all") {
      if (yearFilter === "1")
        data = data.filter((s) => [1, 2].includes(Number(s.semester)));
      else if (yearFilter === "2")
        data = data.filter((s) => [3, 4].includes(Number(s.semester)));
      else if (yearFilter === "3")
        data = data.filter((s) => [5, 6].includes(Number(s.semester)));
    }

    if (deptFilter !== "all") {
      data = data.filter((s) => s.department === deptFilter);
    }

    setFilteredStudents(sortByRegisterNumber(data));
    setPage(1);
  }, [searchTerm, yearFilter, deptFilter, students]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginated = filteredStudents.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ✅ Edit functions
  const startEditing = (student) => {
    setEditingId(student._id);
    setEditForm({
      registerNumber: student.registerNumber,
      name: student.name,
      email: student.email,
      phone: student.phone,
      department: student.department,
      semester: student.semester,
      batch: student.batch || "",
    });
    setSelectedImage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      registerNumber: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      semester: "",
      batch: "",
    });
    setSelectedImage(null);
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (id) => {
    try {
      setAction("updating");
      const token = await getToken();

      const formData = new FormData();
      Object.entries(editForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/updatestudent/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(res.data?.message || "✅ Student updated");
      setStudents(students.map((s) => (s._id === id ? res.data.data : s)));
      cancelEditing();
    } catch (err) {
      console.error("Error updating student:", err);
      toast.error(err.response?.data?.message || "❌ Failed to update student");
    } finally {
      setAction(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      setAction("deleting");
      const token = await getToken();
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/deletestudent/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "✅ Student deleted");
      setStudents((prev) =>
        sortByRegisterNumber(prev.filter((s) => s._id !== id))
      );
    } catch (err) {
      console.error("Error deleting student:", err);
      toast.error(err.response?.data?.message || "❌ Failed to delete student");
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="mt-6 relative overflow-x-auto text-sm">
      {action && <LoaderOverlay message="Processing..." />}

      <h2 className="text-lg font-semibold mb-3">List of Students</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, reg no, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-2 py-1 rounded w-full md:w-1/3 text-sm"
        />

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="border px-2 py-1 rounded w-full md:w-1/4 text-sm"
        >
          <option value="all">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="border px-2 py-1 rounded w-full md:w-1/4 text-sm"
        >
          {departments.map((dept) => (
            <option key={dept.value} value={dept.value}>
              {dept.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading students...</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Sl. No</th>
              <th className="p-2">Image</th>
              <th className="p-2">Register No</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Department</th>
              <th className="p-2">Semester</th>
              <th className="p-2">Batch</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s, idx) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{(page - 1) * pageSize + idx + 1}</td>

                {/* Image */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <div className="flex flex-col items-center">
                      <label className="cursor-pointer text-blue-600 hover:underline text-xs flex items-center gap-1">
                        <Upload className="w-4 h-4" />
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setSelectedImage(e.target.files[0] || null)
                          }
                        />
                      </label>
                      {selectedImage ? (
                        <img
                          src={URL.createObjectURL(selectedImage)}
                          alt="preview"
                          className="w-8 h-8 mt-1 rounded-full object-cover"
                        />
                      ) : (
                        <img
                          src={s.imageUrl}
                          alt={s.name}
                          className="w-8 h-8 mt-1 rounded-full object-cover"
                        />
                      )}
                    </div>
                  ) : s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="registerNumber"
                      value={editForm.registerNumber}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.registerNumber
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.name
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.email
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.phone
                  )}
                </td>

                <td className="p-2 uppercase">
                  {editingId === s._id ? (
                    <input
                      name="department"
                      value={editForm.department}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.department
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="semester"
                      type="number"
                      min="1"
                      max="6"
                      value={editForm.semester}
                      onChange={handleChange}
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.semester
                  )}
                </td>

                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="batch"
                      value={editForm.batch}
                      onChange={handleChange}
                      placeholder="e.g. 2021-2025"
                      className="border rounded px-1 py-0.5 w-full"
                    />
                  ) : (
                    s.batch || "-"
                  )}
                </td>

                <td className="p-2 flex gap-2">
                  {editingId === s._id ? (
                    <>
                      <button
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        onClick={() => handleUpdate(s._id)}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        onClick={cancelEditing}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => startEditing(s)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleDelete(s._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-3 text-sm">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
