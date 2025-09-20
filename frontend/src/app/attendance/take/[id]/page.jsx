"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

export default function TakeAttendancePage() {
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState(null);

  // Fetch students + session details
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const token = await getToken();

        // 1. Get session details
        const sessionRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSessionDetails(sessionRes.data.session || {});
        const { department, semester } = sessionRes.data.session || {};

        // 2. Get all students (filtered)
        const studentsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { department, semester },
          }
        );

        const studentList = (studentsRes.data.data || []).filter(
          (st) =>
            st.department?.toLowerCase() === department?.toLowerCase() &&
            String(st.semester) === String(semester)
        );

        setStudents(studentList);

        // Default all students to "present"
        const init = {};
        studentList.forEach((st) => (init[st._id] = "present"));
        setAttendance(init);
      } catch (err) {
        console.error("Error fetching:", err);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, getToken]);

  // Toggle attendance status
  const toggleStatus = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  // Save attendance with confirmation
  const handleSave = async () => {
    try {
      const token = await getToken();

      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/records`,
        { sessionId: id, records },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Count summary
      const total = students.length;
      const present = Object.values(attendance).filter(
        (s) => s === "present"
      ).length;
      const absent = total - present;

      // Show confirmation toast with JSX
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
            {sessionDetails?.subjectId?.name || "-"}
          </p>
          <p>
            👨‍🏫 <span className="font-medium">Staff:</span>{" "}
            {sessionDetails?.lecturerId?.name || "-"}
          </p>

          <hr className="my-2" />
          <p>
            👥 <span className="text-blue-600 font-medium">Total:</span> {total}
          </p>
          <p className="text-orange-600">
            ✔️ <span className="font-medium">Present:</span> {present}
          </p>
          <p className="text-red-600">
            ❌ <span className="font-medium">Absent:</span> {absent}
          </p>
        </div>,
        { duration: 7000 }
      );
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save attendance");
    }
  };

  if (loading) return <p className="p-4">Loading students...</p>;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => router.back()}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Take Attendance</h1>
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm hidden md:table">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Sl. No</th>
              <th className="p-2 text-left">Dept</th>
              <th className="p-2 text-left">Sem</th>
              <th className="p-2 text-left">Roll No</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Present?</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2 uppercase">{s.department}</td>
                <td className="p-2">{s.semester}</td>
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
                    className="w-4 h-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Table */}
        <table className="w-full border md:hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Sl. No</th>
              <th className="p-2">Roll No</th>
              <th className="p-2">Name</th>
              <th className="p-2">Present?</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st, i) => (
              <tr key={st._id} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{st.registerNumber}</td>
                <td className="p-2">{st.name}</td>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={attendance[st._id] === "present"}
                    onChange={(e) =>
                      toggleStatus(
                        st._id,
                        e.target.checked ? "present" : "absent"
                      )
                    }
                    className="w-4 h-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button (for mobile) */}
      <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded md:hidden"
      >
        Save Attendance
      </button>
    </div>
  );
}
