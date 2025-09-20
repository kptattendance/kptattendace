"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import SubjectHistory from "./SubjectHistory";

export default function StudentStats({ studentId }) {
  const { getToken } = useAuth();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/reports/student-overall`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { studentId },
        }
      );
      setReport(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch student stats:", err);
      toast.error("Failed to load student stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchReport();
  }, [studentId]);

  if (loading) return <p>Loading student stats...</p>;
  if (!report || report.length === 0) return <p>No data available</p>;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">
        📊 Student Attendance Stats
      </h2>

      <table className="w-full border-collapse shadow bg-white rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="px-4 py-2 border">Subject</th>
            <th className="px-4 py-2 border">Total Hours</th>
            <th className="px-4 py-2 border">Attended Hours</th>
            <th className="px-4 py-2 border">Absent Hours</th>
            <th className="px-4 py-2 border">%</th>
          </tr>
        </thead>
        <tbody>
          {report.map((r, i) => (
            <tr
              key={r.subject._id}
              className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-2 border">
                {r.subject.name}
                <div className="mt-1">
                  <SubjectHistory
                    studentId={studentId}
                    subjectId={r.subject._id}
                  />
                </div>
              </td>
              <td className="px-4 py-2 border">{r.totalHours}</td>
              <td className="px-4 py-2 border">{r.attendedHours}</td>
              <td className="px-4 py-2 border">{r.absentHours}</td>
              <td
                className={`px-4 py-2 border font-semibold ${
                  r.percentage < 75 ? "text-red-600" : "text-green-600"
                }`}
              >
                {r.percentage}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
