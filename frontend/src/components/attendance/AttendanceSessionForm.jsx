"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function AttendancePage() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);

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

  // Set department if HOD
  useEffect(() => {
    if (myRole === "hod" && myDept) {
      setForm((f) => ({ ...f, department: myDept }));
    }
  }, [myRole, myDept]);

  // Load subjects dynamically
  useEffect(() => {
    const loadSubjects = async () => {
      if (!form.department || !form.semester) return;
      try {
        setSubjectsLoading(true);
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects`,
          {
            params: {
              department: form.department,
              semester: form.semester,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubjects(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [form.department, form.semester, getToken]);

  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Submit form -> create session -> load students
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

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ handle duplicate session
      if (res.data?.message?.toLowerCase().includes("already exists")) {
        toast.error(res.data.message);
        setLoading(false);
        return;
      }

      const created = res.data.data;
      setSession(created);
      setSessionDetails(created);
      toast.success("✅ Session created successfully");
      await loadStudents(created);
      setShowModal(true);

      // ✅ Reset form fields after submission
      setForm({
        date: "",
        startTime: "",
        endTime: "",
        subjectId: "",
        semester: "",
        department: myRole === "hod" ? myDept : "",
        batch: "",
      });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes("already exists")) {
        toast.error("⚠️ A session already exists for this date and time!");
      } else {
        toast.error("Failed to create session ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load students for created session
  const loadStudents = async (sessionData) => {
    try {
      const token = await getToken();
      const { department, semester, batch } = sessionData;

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { department, semester },
        }
      );
      let all = res.data.data || [];
      let list = batch === "both" ? all : all.filter((s) => s.batch === batch);

      const init = {};
      list.forEach((s) => (init[s._id] = "present"));
      setStudents(list);
      setAttendance(init);
    } catch (err) {
      toast.error("Failed to load students ❌");
    }
  };

  // Toggle present/absent
  const toggleStatus = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  // Save attendance
  const handleSave = async () => {
    if (!session) return;
    try {
      const token = await getToken();
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/records`,
        { sessionId: session._id, records },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const total = students.length;
      const present = Object.values(attendance).filter(
        (s) => s === "present"
      ).length;
      const absent = total - present;
      console.log(sessionDetails);
      toast.success(
        <div className="text-sm">
          <p className="font-semibold text-green-700 mb-2">
            ✅ Attendance saved successfully
          </p>
          <hr className="my-2" />
          <p>
            📘 <span className="font-medium">Department:</span>{" "}
            {sessionDetails?.department || "-"}
          </p>
          <p>
            🎓 <span className="font-medium">Semester:</span>{" "}
            {sessionDetails?.semester || "-"}
          </p>
          <p>
            📖 <span className="font-medium">Subject:</span>{" "}
            {sessionDetails?.subjectName ||  "-"}
          </p>
          <hr className="my-2" />
          <p>👥 Total: {total}</p>
          <p className="text-orange-600">✔️ Present: {present}</p>
          <p className="text-red-600">❌ Absent: {absent}</p>
        </div>,
        { duration: 7000 }
      );

      // Reset everything
      setShowModal(false);
      setSession(null);
      setStudents([]);
      setAttendance({});
      setForm({
        subject: "",
        semester: "",
        section: "",
        period: "",
        date: "",
      });
    } catch (err) {
      toast.error("Failed to save attendance ❌");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSession(null);
    setStudents([]);
  };

  const departments = [
    { value: "at", label: "Automobile Engineering" },
    { value: "ch", label: "Chemical Engineering" },
    { value: "ce", label: "Civil Engineering" },
    { value: "cs", label: "Computer Science Engineering" },
    { value: "ec", label: "Electronics & Communication Engineering" },
    { value: "eee", label: "Electrical & Electronics Engineering" },
    { value: "me", label: "Mechanical Engineering" },
  ];

  const times = Array.from({ length: 9 }, (_, i) => {
    const hour = 9 + i;
    const value = `${hour.toString().padStart(2, "0")}:00`;
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour < 12 ? "AM" : "PM";
    const label = `${hour12}:00 ${suffix}`;
    return { value, label };
  });

  return (
    <div className="p-4 space-y-6">
      {/* FORM SECTION */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">
          Create Attendance Session
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="border px-2 py-1 rounded"
          />
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
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            disabled={myRole === "hod" && myDept}
            className="border px-2 py-1 rounded"
          >
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            name="subjectId"
            value={form.subjectId}
            onChange={handleChange}
            required
            disabled={!form.department || !form.semester}
            className="border px-2 py-1 rounded col-span-1 md:col-span-2"
          >
            <option value="">
              {subjectsLoading ? "Loading subjects..." : "Select subject"}
            </option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>

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
            <option value="both">Both</option>
          </select>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {loading ? "Creating..." : "Mark Attendance"}
            </button>
          </div>
        </form>
      </section>

      {/* MODAL POPUP FOR STUDENTS */}
      {showModal && session && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4">
              Mark Attendance — {students.length} Students
            </h3>

            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded-lg">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Sl. No</th>
                    <th className="p-2 text-left">Batch</th>
                    <th className="p-2 text-left">Roll No</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Present?</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s._id} className="border-t">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 uppercase">{s.batch}</td>
                      <td className="p-2">{s.registerNumber}</td>
                      <td className="p-2">{s.name}</td>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={attendance[s._id] === "present"}
                          onChange={(e) =>
                            toggleStatus(
                              s._id,
                              e.target.checked ? "present" : "absent"
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
