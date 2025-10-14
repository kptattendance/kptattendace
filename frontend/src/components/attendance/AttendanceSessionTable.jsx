// src/components/attendance/AttendanceSessionTable.jsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Pencil, Trash2, Save, X } from "lucide-react";
import LoaderOverlay from "../LoaderOverlay";
import Link from "next/link";

export default function AttendanceSessionTable({ refreshKey }) {
  const { getToken } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // controls
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // inline edit state
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const [action, setAction] = useState(null); // "deleting" | "updating"

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // res.data.data expected
      const arr = res.data.data || res.data || [];
      // sort by date & time for deterministic order
      arr.sort((a, b) => {
        const da = new Date(a.date + " " + (a.timeSlot || ""));
        const db = new Date(b.date + " " + (b.timeSlot || ""));
        return da - db;
      });
      setSessions(arr);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  // filters/search
  useEffect(() => {
    let data = [...sessions];
    if (deptFilter !== "all")
      data = data.filter((s) => s.department === deptFilter);
    if (semesterFilter !== "all")
      data = data.filter((s) => String(s.semester) === String(semesterFilter));
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((s) =>
        `${s.subject?.code || ""} ${s.subject?.name || ""} ${
          s.lecturerName || s.lecturer?.name || ""
        }`
          .toLowerCase()
          .includes(q)
      );
    }
    setFiltered(data);
    setPage(1);
  }, [search, deptFilter, semesterFilter, sessions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id) => {
    if (!confirm("Delete this session?")) return;
    try {
      setAction("deleting");
      const token = await getToken();
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(res.data?.message || "Session deleted");
      setSessions((s) => s.filter((x) => x._id !== id));
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error(err.response?.data?.message || "Failed to delete session");
    } finally {
      setAction(null);
    }
  };

  // start edit
  const startEdit = (session) => {
    setEditId(session._id);
    // split timeSlot into start/end if present
    const [startTime = "", endTime = ""] = (session.timeSlot || "").split("-");
    setEditData({
      date: session.date?.slice(0, 10) || "",
      startTime,
      endTime,
      subjectId: session.subjectId?._id || session.subjectId || "",
      lecturerId: session.lecturerId?._id || session.lecturerId || "",
      semester: session.semester || "",
      department: session.department || "",
      room: session.room || "",
      notes: session.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const handleSave = async (id) => {
    try {
      setAction("updating");
      const token = await getToken();

      const payload = {
        date: editData.date,
        timeSlot: `${editData.startTime}-${editData.endTime}`,
        subjectId: editData.subjectId,
        lecturerId: editData.lecturerId,
        semester: Number(editData.semester),
        department: editData.department,
        room: editData.room,
        notes: editData.notes,
      };

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data?.message || "Session updated");
      setSessions((arr) =>
        arr.map((s) =>
          s._id === id ? res.data.data || { ...s, ...payload } : s
        )
      );
      setEditId(null);
    } catch (err) {
      console.error("Error updating session:", err);
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setAction(null);
    }
  };

  // department options (short codes)
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

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm text-sm relative">
      {action && (
        <LoaderOverlay
          message={action === "deleting" ? "Deleting..." : "Updating..."}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center md:gap-3 justify-between mb-3">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search subject / lecturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-2 py-1 rounded w-56 text-sm"
          />
          <select
            className="border px-2 py-1 rounded text-sm"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            className="border px-2 py-1 rounded text-sm"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="all">All Sem</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>{`Sem ${s}`}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500">Total: {filtered.length}</div>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-xs md:text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Subject</th>
              <th className="p-2 text-left">Lecturer</th>
              <th className="p-2 text-left">Dept</th>
              <th className="p-2 text-left">Sem</th>{" "}
              <th className="p-2 text-left">Batch</th> {/* ✅ new */}
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((s, idx) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{(page - 1) * pageSize + idx + 1}</td>
                <td className="p-2">{(s.date || "").slice(0, 10)}</td>
                <td className="p-2">{s.timeSlot || ""}</td>
                <td className="p-2">
                  {s.subjectId?.code
                    ? `${s.subjectId.code} — ${s.subjectId.name}`
                    : s.subjectName || ""}
                </td>
                <td className="p-2">
                  {s.lecturerId?.name || s.lecturerName || ""}
                </td>
                <td className="p-2 uppercase">{s.department}</td>
                <td className="p-2">{s.semester}</td>
                <td className="p-2">{s.batch || "—"}</td> {/* ✅ new */}
                <td className="p-2 flex gap-2">
                  <button
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    onClick={() => handleDelete(s._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-3 text-xs">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
