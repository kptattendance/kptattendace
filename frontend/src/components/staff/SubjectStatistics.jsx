"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function getDuration(timeSlot) {
  if (!timeSlot) return 0;
  const [start, end] = timeSlot.split("-");
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return (endMinutes - startMinutes) / 60;
}

export default function SubjectStatistics() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [filters, setFilters] = useState({
    department: "",
    semester: "",
    subjectId: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const myRole = user?.publicMetadata?.role;
  const myDept = user?.publicMetadata?.department;

  const downloadExcel = () => {
    if (report.length === 0) {
      toast.error("No data to download");
      return;
    }
    // Prepare data
    const data = report.map((stu) => {
      const row = {
        "Reg No": stu.registerNumber,
        Name: stu.name,
      };

      allSessions.forEach((s) => {
        const status = stu.sessions.find(
          (ses) =>
            new Date(ses.date).toLocaleDateString("en-GB") === s.date &&
            ses.timeSlot === s.timeSlot
        )?.status;
        row[`${s.date} (${s.timeSlot})`] = `${s.duration}h ${
          status === "Absent" ? "❌" : ""
        }`;
      });

      let totalHeld = allSessions.reduce((sum, s) => sum + s.duration, 0);
      let totalAttended = 0;
      allSessions.forEach((s) => {
        const status = stu.sessions.find(
          (ses) =>
            new Date(ses.date).toLocaleDateString("en-GB") === s.date &&
            ses.timeSlot === s.timeSlot
        )?.status;
        if (status === "Present") totalAttended += s.duration;
      });
      row["Attended Hours"] = `${totalAttended}h`;
      row["Overall %"] = `${Math.round((totalAttended / totalHeld) * 100)}%`;

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "AttendanceReport.xlsx");
  };

  // 🔹 Auto-lock department if HOD
  useEffect(() => {
    if (myRole === "hod" && myDept) {
      setFilters((f) => ({ ...f, department: myDept }));
    }
  }, [myRole, myDept]);

  // 🔹 Load subjects when department + semester selected
  useEffect(() => {
    const loadSubjects = async () => {
      if (!filters.department || !filters.semester) {
        setSubjects([]);
        return;
      }
      try {
        setSubjectsLoading(true);
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/getsubjects`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              department: filters.department,
              semester: filters.semester,
            },
          }
        );
        setSubjects(res.data.data || []);
      } catch (err) {
        console.error("Error loading subjects:", err);
        toast.error("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [filters.department, filters.semester, getToken]);

  const fetchReport = async () => {
    if (!filters.department || !filters.semester || !filters.subjectId) {
      toast.error("Please select all filters");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/subject-wise`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            department: filters.department.toLowerCase(),
            semester: filters.semester,
            subjectId: filters.subjectId,
          },
        }
      );
      setReport(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch subject stats:", err);
      toast.error("Failed to load subject statistics");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Collect all unique sessions across students
  const allSessions = (() => {
    if (report.length === 0) return [];
    const seen = new Set();
    const sessions = [];
    report.forEach((stu) => {
      stu.sessions.forEach((s) => {
        const dateStr = new Date(s.date).toLocaleDateString("en-GB");
        const key = `${dateStr}_${s.timeSlot}`;
        if (!seen.has(key)) {
          seen.add(key);
          sessions.push({
            date: dateStr,
            timeSlot: s.timeSlot,
            duration: getDuration(s.timeSlot),
          });
        }
      });
    });

    // sort by date and time
    sessions.sort((a, b) => {
      const da = new Date(a.date.split("/").reverse().join("-"));
      const db = new Date(b.date.split("/").reverse().join("-"));
      if (da - db !== 0) return da - db;
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    return sessions;
  })();

  const departments = [
    { value: "cs", label: "Computer Science" },
    { value: "ce", label: "Civil" },
    { value: "me", label: "Mechanical" },
    { value: "ec", label: "ECE" },
    { value: "eee", label: "EEE" },
    { value: "ch", label: "Chemical" },
    { value: "po", label: "Polymer" },
    { value: "at", label: "Automobile" },
    { value: "sc", label: "Science & English" },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">
        📊 Subject Attendance Statistics
      </h2>

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchReport();
        }}
        className="flex flex-wrap gap-4 mb-6"
      >
        {/* Department */}
        <select
          value={filters.department}
          onChange={(e) =>
            setFilters({ ...filters, department: e.target.value })
          }
          disabled={myRole === "hod" && myDept && myDept !== "sc"}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        {/* Semester */}
        <select
          value={filters.semester}
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">Select Semester</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
        {/* Subjects */}
        <select
          value={filters.subjectId}
          onChange={(e) =>
            setFilters({ ...filters, subjectId: e.target.value })
          }
          disabled={!filters.department || !filters.semester}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">
            {subjectsLoading
              ? "Loading subjects..."
              : !filters.department || !filters.semester
              ? "Select dept & semester first"
              : subjects.length === 0
              ? "No subjects available"
              : "Select subject"}
          </option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch Report"}
        </button>{" "}
        <button
          onClick={downloadExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-md "
        >
          Download Excel
        </button>
      </form>

      {/* Loading / Empty states */}
      {loading && <p>Loading report...</p>}
      {!loading && report.length === 0 && (
        <p className="text-gray-600">No data available</p>
      )}

      {/* Report Table */}
      {!loading && report.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border">Sl. No</th>
                <th className="px-4 py-2 border">Reg No</th>
                <th className="px-4 py-2 border">Name</th>
                {allSessions.map((s, idx) => (
                  <th key={idx} className="px-4 py-2 border text-center">
                    {s.date}
                    <div className="text-xs text-gray-600">{s.duration}h</div>
                  </th>
                ))}
                <th className="px-4 py-2 border text-center">Attended Hours</th>
                <th className="px-4 py-2 border text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {report.map((stu, i) => {
                const sessionMap = {};
                stu.sessions.forEach((s) => {
                  const dateStr = new Date(s.date).toLocaleDateString("en-GB");
                  sessionMap[`${dateStr}_${s.timeSlot}`] = s.status;
                });

                let totalHeld = 0;
                let totalAttended = 0;
                allSessions.forEach((s) => {
                  totalHeld += s.duration;
                  if (sessionMap[`${s.date}_${s.timeSlot}`] === "Present") {
                    totalAttended += s.duration;
                  }
                });
                const percent = Math.round((totalAttended / totalHeld) * 100);

                return (
                  <tr
                    key={stu._id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 border">{i + 1}</td>
                    <td className="px-4 py-2 border">{stu.registerNumber}</td>
                    <td className="px-4 py-2 border">{stu.name}</td>

                    {/* Sessions */}
                    {allSessions.map((s, idx) => {
                      const status = sessionMap[`${s.date}_${s.timeSlot}`];
                      return (
                        <td
                          key={idx}
                          className={`px-2 py-1 border text-center font-medium ${
                            status === "Absent"
                              ? "text-red-600"
                              : status === "Present"
                              ? "text-green-700"
                              : "text-gray-400"
                          }`}
                        >
                          {status === "Present"
                            ? `${s.duration}h`
                            : status === "Absent"
                            ? "❌"
                            : "-"}
                        </td>
                      );
                    })}

                    {/* Totals */}
                    <td className="px-4 py-2 border text-center font-semibold">
                      {totalAttended}h
                    </td>
                    <td
                      className={`px-4 py-2 border text-center font-semibold ${
                        percent < 75
                          ? "text-red-600 bg-red-50"
                          : "text-green-700"
                      }`}
                    >
                      {percent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
