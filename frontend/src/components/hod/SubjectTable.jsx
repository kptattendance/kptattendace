"use client";
import { useUser } from "@clerk/nextjs";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Trash2, Pencil, Check, X } from "lucide-react";
import LoaderOverlay from "../LoaderOverlay";

export default function SubjectTable({ refreshKey }) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [subjects, setSubjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true); // for fetching list
  const [actionLoading, setActionLoading] = useState(false); // for delete/edit
  const [semesterFilter, setSemesterFilter] = useState("");

  // Inline edit state
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    code: "",
    name: "",
    semester: "",
  });

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch subjects

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const department = user?.publicMetadata?.department || null;
      const role = user?.publicMetadata?.role || "user";

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects`;

      // If user is NOT admin, filter by department
      if (role !== "admin" && department) {
        url += `?department=${department}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res.data.data);
      setSubjects(res.data.data);
    } catch (err) {
      toast.error("❌ Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [refreshKey]);

  // Apply search filter
  useEffect(() => {
    let data = [...subjects];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.code.toLowerCase().includes(lower)
      );
    }
    setFiltered(data);
    setPage(1);
  }, [searchTerm, subjects]);

  useEffect(() => {
    let data = [...subjects];

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.code.toLowerCase().includes(lower)
      );
    }

    // Semester filter
    if (semesterFilter) {
      data = data.filter((s) => String(s.semester) === String(semesterFilter));
    }

    setFiltered(data);
    setPage(1);
  }, [searchTerm, semesterFilter, subjects]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Delete subject
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      setActionLoading(true);
      const token = await getToken();
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/deletesubject/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "✅ Subject deleted");
      setSubjects(subjects.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Error deleting subject:", err);
      toast.error(err.response?.data?.message || "❌ Failed to delete subject");
    } finally {
      setActionLoading(false);
    }
  };

  // Start editing
  const handleEdit = (subject) => {
    setEditId(subject._id);
    setEditData({
      code: subject.code,
      name: subject.name,
      semester: subject.semester,
    });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditId(null);
    setEditData({ code: "", name: "", semester: "" });
  };

  // Save update
  const handleSave = async (id) => {
    try {
      setActionLoading(true);
      const token = await getToken();

      const updatedData = {
        code: editData.code.toUpperCase(),
        name: editData.name.toUpperCase(),
        semester: editData.semester,
      };

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/updatesubject/${id}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data?.message || "✅ Subject updated");
      setSubjects(
        subjects.map((s) => (s._id === id ? { ...s, ...updatedData } : s))
      );
      setEditId(null);
    } catch (err) {
      console.error("Error updating subject:", err);
      toast.error(err.response?.data?.message || "❌ Failed to update subject");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="rounded-lg p-4 shadow-sm bg-white text-sm">
      {actionLoading && <LoaderOverlay message="Processing..." />}

      <h2 className="text-lg font-semibold mb-3">Subjects</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by code or name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-2 py-1 rounded mb-3 w-full md:w-1/3"
      />

      <select
        value={semesterFilter}
        onChange={(e) => setSemesterFilter(e.target.value)}
        className="border px-2 py-1 ml-5 rounded w-full md:w-1/4"
      >
        <option value="">All Semesters</option>
        {[1, 2, 3, 4, 5, 6].map((sem) => (
          <option key={sem} value={sem}>
            {sem}
          </option>
        ))}
      </select>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-center py-4">Loading subjects...</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Sl. No</th>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Semester</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s, idx) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{(page - 1) * pageSize + idx + 1}</td>

                {/* Code */}
                <td className="p-2">
                  {editId === s._id ? (
                    <input
                      value={editData.code}
                      onChange={(e) =>
                        setEditData({ ...editData, code: e.target.value })
                      }
                      className="border px-1 py-0.5 rounded w-full"
                    />
                  ) : (
                    s.code
                  )}
                </td>

                {/* Name */}
                <td className="p-2">
                  {editId === s._id ? (
                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      className="border px-1 py-0.5 rounded w-full"
                    />
                  ) : (
                    s.name
                  )}
                </td>

                {/* Semester */}
                <td className="p-2">
                  {editId === s._id ? (
                    <input
                      value={editData.semester}
                      onChange={(e) =>
                        setEditData({ ...editData, semester: e.target.value })
                      }
                      className="border px-1 py-0.5 rounded w-full"
                    />
                  ) : (
                    s.semester
                  )}
                </td>

                {/* Actions */}
                <td className="p-2 flex gap-2">
                  {editId === s._id ? (
                    <>
                      <button
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        onClick={() => handleSave(s._id)}
                      >
                        <Check className="w-4 h-4" /> Save
                      </button>
                      <button
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex gap-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => handleEdit(s)}
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </button>
                      <button
                        className="flex gap-2 p-1 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleDelete(s._id)}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No subjects found
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
