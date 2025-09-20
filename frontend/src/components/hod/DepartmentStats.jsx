"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import HodStudentStats from "./statistics/HodStudentStats";

export default function DepartmentStats({ dept = "Your Department" }) {
  const { getToken } = useAuth();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: "",
    semester: "",
    month: "",
  });

  const formatCell = (val) => {
    if (!val) return "0h";
    const hours = val.hours ?? 0;
    const pct = val.percent ?? null;
    return pct !== null ? `${hours}h (${pct}%)` : `${hours}h`;
  };

  const transformReport = (reportArr) => {
    const yearMap = {};

    reportArr.forEach((subjEntry) => {
      const sem = subjEntry.semester ?? subjEntry.subject?.semester ?? 0;
      const year =
        sem === 1 || sem === 2
          ? "1st Year"
          : sem === 3 || sem === 4
          ? "2nd Year"
          : sem === 5 || sem === 6
          ? "3rd Year"
          : sem === 7 || sem === 8
          ? "4th Year"
          : "Other";

      if (!yearMap[year]) yearMap[year] = {};

      const subjectName =
        subjEntry.subject?.name || subjEntry.subjectName || "Unknown Subject";
      const totalHours = subjEntry.totalHours ?? subjEntry.totalClasses ?? 0;

      (subjEntry.students || []).forEach((stu) => {
        // ✅ Use a clean student ID
        const sid = String(stu._id || stu.id || stu.registerNumber);

        if (!yearMap[year][sid]) {
          yearMap[year][sid] = {
            regNo: stu.registerNumber || stu.regNo || "-",
            name: stu.name || "-",
            phone: stu.phone || "-",
            imageUrl: stu.imageUrl || null,
            subjects: {},
          };
        }

        let hours = stu.attendedHours ?? stu.attended ?? 0;
        let percent = stu.percentage ?? null;

        // Fallback: calculate percent if missing
        if (!percent && totalHours > 0) {
          percent = ((hours / totalHours) * 100).toFixed(2);
        }

        yearMap[year][sid].subjects[subjectName] = {
          hours,
          percent,
          totalHours,
        };
      });
    });

    const grouped = {};
    Object.entries(yearMap).forEach(([year, students]) => {
      grouped[year] = Object.values(students);
    });

    return grouped;
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/reports/class-subject`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            ...(filters.department && {
              department: filters.department.toLowerCase(),
            }),
            ...(filters.semester && { semester: filters.semester }),
            ...(filters.month && { month: filters.month }),
          },
        }
      );
      setReport(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.department) {
      fetchReport();
    }
  }, [filters]);

  const grouped = transformReport(report);

  // Build subject metadata (names + totals)
  const subjectMetaByYear = {};
  (report || []).forEach((subjEntry) => {
    const sem = subjEntry.semester ?? subjEntry.subject?.semester ?? 0;
    const year =
      sem === 1 || sem === 2
        ? "1st Year"
        : sem === 3 || sem === 4
        ? "2nd Year"
        : sem === 5 || sem === 6
        ? "3rd Year"
        : sem === 7 || sem === 8
        ? "4th Year"
        : "Other";

    if (!subjectMetaByYear[year]) subjectMetaByYear[year] = {};

    const name =
      subjEntry.subject?.name || subjEntry.subjectName || "Unknown Subject";
    const totalHours = subjEntry.totalHours ?? subjEntry.totalClasses ?? 0;

    subjectMetaByYear[year][name] = totalHours;
  });

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">
        {dept} — Attendance Report
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchReport();
        }}
        className="flex flex-wrap gap-4 mb-6"
      >
        <select
          value={filters.department}
          onChange={(e) =>
            setFilters({ ...filters, department: e.target.value })
          }
          className="border px-3 py-2 rounded-md"
        >
          <option value="">Select Department</option>
          <option value="at">AT </option>
          <option value="ch">CH </option>
          <option value="ce">CE </option>
          <option value="cs">CS </option>
          <option value="ec">EC </option>
          <option value="eee">EEE </option>
          <option value="me">ME </option>
          <option value="po">PO </option>
          <option value="sc">SC </option>
        </select>

        <select
          value={filters.semester}
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Semesters</option>
          {[...Array(6)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Semester {i + 1}
            </option>
          ))}
        </select>

        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Apply
        </button>
      </form>

      {loading && <p>Loading report...</p>}
      {!loading && report.length === 0 && <p>No data available</p>}

      {!loading &&
        Object.entries(grouped).map(([year, students]) => (
          <div
            key={year}
            className="mb-8 bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="bg-gray-100 px-4 py-3 font-medium text-lg border-b">
              {year}
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="px-4 py-2 border">Sl. No</th>
                  <th className="px-4 py-2 border">Photo</th>
                  <th className="px-4 py-2 border">Reg No</th>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Phone</th>
                  {Object.entries(subjectMetaByYear[year] || {}).map(
                    ([subj, total]) => (
                      <th key={subj} className="px-4 py-2 border">
                        {subj} <br />
                        <span className="text-xs text-gray-600">
                          ({total}h)
                        </span>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((stu, i) => (
                  <tr
                    key={stu.regNo || i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 border">{i + 1}</td>
                    <td className="px-4 py-2 border text-center">
                      {stu.imageUrl ? (
                        <img
                          src={stu.imageUrl}
                          alt={stu.name}
                          className="w-10 h-10 rounded-full object-cover mx-auto"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No Image</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border">{stu.regNo}</td>
                    <td className="px-4 py-2 border">{stu.name}</td>
                    <td className="px-4 py-2 border">{stu.phone || "-"}</td>

                    {Object.keys(subjectMetaByYear[year] || {}).map((subj) => (
                      <td
                        key={subj}
                        className={`px-4 py-2 border text-center ${
                          stu.subjects[subj]?.percent < 75
                            ? "bg-red-100 text-red-700 font-semibold"
                            : ""
                        }`}
                      >
                        {formatCell(stu.subjects[subj])}
                        {stu.subjects[subj]?.percent < 75 && (
                          <span className="ml-1 text-xs text-red-500">
                            (Shortage)
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      <HodStudentStats />
    </section>
  );
}
