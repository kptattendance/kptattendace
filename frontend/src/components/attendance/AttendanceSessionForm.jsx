"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AttendanceSessionForm({ onCreated }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    subjectId: "",
    semester: "",
    department: "",
    batch: "",
  });

  const myRole = user?.publicMetadata?.role;
  const myDept = user?.publicMetadata?.department;

  // Lock department if HOD
  useEffect(() => {
    if (myRole === "hod" && myDept) {
      setForm((f) => ({ ...f, department: myDept }));
    }
  }, [myRole, myDept]);

  // ✅ Single useEffect to load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      if (!form.department || !form.semester) return;
      try {
        setSubjectsLoading(true);
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects?department=${form.department}&semester=${form.semester}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjects(res.data.data || []);
      } catch (err) {
        console.error("Error loading subjects:", err);
        toast.error("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };

    setSubjects([]); // clear before loading new
    loadSubjects();
  }, [form.department, form.semester, getToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !form.subjectId ||
      !form.semester ||
      !form.department
    ) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const start = new Date(`1970-01-01T${form.startTime}:00`);
      const end = new Date(`1970-01-01T${form.endTime}:00`);
      let duration = (end - start) / (1000 * 60 * 60);
      if (!duration || duration <= 0) duration = 1;

      const payload = {
        date: form.date,
        timeSlot: `${form.startTime}-${form.endTime}`,
        subjectId: form.subjectId,
        semester: Number(form.semester),
        department: form.department,
        batch: form.batch,
        lecturerId: user?.id,
        duration,
      };

      console.log("Payload:", payload);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data?.message || "Session created ✅", {
        duration: 1000,
      });

      if (res.data.redirectTo) {
        router.push(res.data.redirectTo);
      }

      // Reset form
      setForm({
        date: "",
        startTime: "",
        endTime: "",
        subjectId: "",
        semester: "",
        department: myRole === "hod" ? myDept : "",
        batch: "",
      });

      if (onCreated) onCreated(res.data.data || res.data);
    } catch (err) {
      console.error("Error creating session:", err);
      toast.error(err.response?.data?.message || "Failed to create session ❌");
    } finally {
      setLoading(false);
    }
  };

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

  // Generate times 09:00 - 17:00
  const times = Array.from({ length: 9 }, (_, i) => {
    const hour = 9 + i;
    const value = `${hour.toString().padStart(2, "0")}:00`;
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour < 12 ? "AM" : "PM";
    const label = `${hour12}:00 ${suffix}`;
    return { value, label };
  });

  return (
    <section className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Create Attendance Session</h3>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {/* Date */}
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          className="border px-2 py-1 rounded"
        />

        {/* Start Time */}
        <select
          name="startTime"
          value={form.startTime}
          onChange={handleChange}
          required
          className="border px-2 py-1 rounded"
        >
          <option value="">Start Time</option>
          {times.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* End Time */}
        <select
          name="endTime"
          value={form.endTime}
          onChange={handleChange}
          required
          className="border px-2 py-1 rounded"
        >
          <option value="">End Time</option>
          {times.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Semester */}
        <select
          name="semester"
          value={form.semester}
          onChange={handleChange}
          required
          className="border px-2 py-1 rounded"
        >
          <option value="">Semester</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Department */}
        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          required
          disabled={myRole === "hod" && myDept && myDept !== "sc"}
          className="border px-2 py-1 rounded"
        >
          <option value="">Department</option>
          {departments.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {/* Subjects */}
        <select
          name="subjectId"
          value={form.subjectId}
          onChange={handleChange}
          required
          disabled={!form.department || !form.semester}
          className="border px-2 py-1 rounded col-span-1 md:col-span-2"
        >
          <option value="">
            {subjectsLoading
              ? "Loading subjects..."
              : !form.department || !form.semester
              ? "Select dept & semester first"
              : subjects.length === 0
              ? "No subjects available"
              : "Select subject"}
          </option>

          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.code} — {s.name} (Sem {s.semester})
            </option>
          ))}
        </select>

        {/* Batch */}
        <select
          name="batch"
          value={form.batch}
          onChange={handleChange}
          required
          className="border px-2 py-1 rounded"
        >
          <option value="">Select Batch</option>
          <option value="b1">B1</option>
          <option value="b2">B2</option>
          <option value="both">Both B1 & B2</option>
        </select>

        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                Creating...
              </>
            ) : (
              "Mark Attendance"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
