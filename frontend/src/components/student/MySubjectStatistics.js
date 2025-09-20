"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

function getDuration(timeSlot) {
  if (!timeSlot) return 0;
  const [start, end] = timeSlot.split("-");
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export default function MySubjectStatistics() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // 🔹 Fetch student's enrolled subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setSubjectsLoading(true);
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/my-subjects`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubjects(res.data.subjects || []);
        if (res.data.subjects?.length > 0)
          setSubjectId(res.data.subjects[0]._id);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        toast.error("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };
    if (user?.id) fetchSubjects();
  }, [getToken, user]);

  // 🔹 Fetch attendance for selected subject
  const fetchReport = async () => {
    if (!subjectId) {
      toast.error("Please select a subject");
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/my-subject-wise`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { subjectId },
        }
      );
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch subject stats:", err);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Calculate total held and attended hours
  let totalHeld = 0;
  let totalAttended = 0;
  sessions.forEach((s) => {
    const dur = getDuration(s.timeSlot);
    totalHeld += dur;
    if (s.status === "Present") totalAttended += dur;
  });
  const percent =
    totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 0;

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">📘 My Subject Attendance</h2>

      {/* Subject Selection */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchReport();
        }}
        className="flex gap-4 mb-6"
      >
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={subjectsLoading || subjects.length === 0}
          className="border px-3 py-2 rounded-md flex-1"
        >
          {subjectsLoading && <option>Loading subjects...</option>}
          {!subjectsLoading && subjects.length === 0 && (
            <option>No subjects found</option>
          )}
          {!subjectsLoading &&
            subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} — {s.name}
              </option>
            ))}
        </select>

        <button
          type="submit"
          disabled={loading || !subjectId}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
      </form>

      {/* Loading / Empty states */}
      {loading && <p>Loading sessions...</p>}
      {!loading && sessions.length === 0 && (
        <p className="text-gray-600">No sessions found</p>
      )}

      {/* Session List */}
      {!loading && sessions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border">Sl. No</th>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Time</th>
                <th className="px-4 py-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => {
                const dur = getDuration(s.timeSlot);
                return (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 border">{i + 1}</td>
                    <td className="px-4 py-2 border">
                      {new Date(s.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-2 border">{s.timeSlot}</td>
                    <td
                      className={`px-4 py-2 border text-center font-medium ${
                        s.status === "Present"
                          ? "text-green-600 bg-green-50"
                          : "text-red-600 bg-red-50"
                      }`}
                    >
                      {`${dur}h ${s.status === "Absent" ? "❌" : ""}`}
                      {/* {s.status === "Present" ? `${dur}h` :`${dur}h` "❌"} */}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={3} className="px-4 py-2 border text-right">
                  Total Held Hours
                </td>
                <td className="px-4 py-2 border text-center">{totalHeld}h</td>
              </tr>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={3} className="px-4 py-2 border text-right">
                  Total Attended Hours
                </td>
                <td className="px-4 py-2 border text-center">
                  {totalAttended}h
                </td>
              </tr>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={3} className="px-4 py-2 border text-right">
                  Overall %
                </td>
                <td
                  className={`px-4 py-2 border text-center ${
                    percent < 75 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {percent}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
