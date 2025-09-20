"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, Search } from "lucide-react";
import LoaderOverlay from "../LoaderOverlay";

const departments = [
  { value: "", label: "All Departments" },
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

export default function StaffTable() {
  const { getToken } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // "updating" | "deleting"
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  });

  // filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // fetch staff list
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/getusers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaff(res.data.filter((u) => u.role === "staff"));
    } catch (err) {
      console.error("Error fetching staff:", err);
      toast.error("❌ Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // enter edit mode
  const startEditing = (staffMember) => {
    setEditingId(staffMember._id);
    setEditForm({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      department: staffMember.department,
    });
  };

  // cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", phone: "", department: "" });
  };

  // handle edit form change
  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // update
  const handleUpdate = async (id) => {
    try {
      setAction("updating");
      const token = await getToken();
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/updateuser/${id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "✅ Staff updated");
      setStaff(staff.map((s) => (s._id === id ? res.data.data : s)));
      cancelEditing();
    } catch (err) {
      console.error("Error updating staff:", err);
      toast.error(err.response?.data?.message || "❌ Failed to update staff");
    } finally {
      setAction(null);
    }
  };

  // delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      setAction("deleting");
      const token = await getToken();
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/deleteuser/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "✅ Staff deleted");
      setStaff(staff.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Error deleting staff:", err);
      toast.error(err.response?.data?.message || "❌ Failed to delete staff");
    } finally {
      setAction(null);
    }
  };

  // apply filters
  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept ? s.department === filterDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="mt-10 relative">
      {action && (
        <LoaderOverlay
          message={
            action === "updating" ? "Updating staff..." : "Deleting staff..."
          }
        />
      )}

      <h2 className="text-xl font-semibold mb-4">List of Staff</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border rounded-lg w-full"
          />
        </div>

        {/* Department filter */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          {departments.map((dept) => (
            <option key={dept.value} value={dept.value}>
              {dept.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading staff...</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">Sl. No</th>
              <th className="p-2 text-left">Image</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStaff.map((s, index) => (
              <tr key={s._id} className="border-t">
                {/* Sl No */}
                <td className="p-2 text-center">{index + 1}</td>

                {/* Profile Image */}
                <td className="p-2">
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      N/A
                    </div>
                  )}
                </td>

                {/* Name */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    s.name
                  )}
                </td>

                {/* Email */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    s.email
                  )}
                </td>

                {/* Phone */}
                <td className="p-2">
                  {editingId === s._id ? (
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    s.phone
                  )}
                </td>

                {/* Department */}
                <td className="p-2 uppercase">
                  {editingId === s._id ? (
                    <select
                      name="department"
                      value={editForm.department}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-full"
                    >
                      {departments
                        .filter((d) => d.value !== "")
                        .map((dept) => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                    </select>
                  ) : (
                    s.department
                  )}
                </td>

                {/* Actions */}
                <td className="p-2 flex gap-2">
                  {editingId === s._id ? (
                    <>
                      <button
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        onClick={() => handleUpdate(s._id)}
                      >
                        ✅ Save
                      </button>
                      <button
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        onClick={cancelEditing}
                      >
                        ❌ Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => startEditing(s)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleDelete(s._id)}
                      >
                        🗑 Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
