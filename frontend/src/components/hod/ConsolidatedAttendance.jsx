"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import LoaderOverlay from "../LoaderOverlay";

/* Helpers */
function getDuration(timeSlot) {
  if (!timeSlot) return 0;
  const [start, end] = timeSlot.split("-");
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}
function normalizeBatch(batch) {
  if (!batch) return "Unknown";
  if (batch === "B1" || batch === "b1") return "B1";
  if (batch === "B2" || batch === "b2") return "B2";
  if (batch === "Both" || batch === "both") return "Both";
  return batch;
}
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * ConsolidatedAttendance
 *
 * - Uses: /api/subjects/getsubjects and /api/statistics/subject-wise
 * - Fetches subjects for selected dept+semester then fetches subject-wise stats for each subject
 * - Computes per-subject per-student attended/held hours (batch-aware)
 * - Aggregates per-student across subjects and renders grouped table + Excel exports
 */
export default function ConsolidatedAttendance({ dept = "Your Department" }) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [filters, setFilters] = useState({
    department: "",
    semester: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  // groupedByYear: { "1st Year": [studentObjects...] }
  const [groupedByYear, setGroupedByYear] = useState({});
  // subjectMetaByYear: { "1st Year": { subjectName: { totalHours, batchTotals } } }
  const [subjectMetaByYear, setSubjectMetaByYear] = useState({});

  const myRole = user?.publicMetadata?.role;
  const myDept = user?.publicMetadata?.department;

  // Auto-lock department if HOD
  useEffect(() => {
    if (myRole === "hod" && myDept) {
      setFilters((f) => ({ ...f, department: myDept }));
    }
  }, [myRole, myDept]);

  // Load subjects when department + semester selected
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

  // MAIN: fetch per-subject stats and build consolidated view
  const fetchConsolidated = async () => {
    if (!filters.department || !filters.semester) {
      toast.error("Please select department & semester");
      return;
    }

    if (!subjects || subjects.length === 0) {
      toast.error("No subjects found for selected department & semester");
      return;
    }

    try {
      setLoading(true);

      const token = await getToken();

      // Fetch each subject's subject-wise report in parallel (gracefully handle per-subject failures)
      const subjPromises = subjects.map((subj) =>
        axios
          .get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/subject-wise`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                department: filters.department.toLowerCase(),
                semester: filters.semester,
                subjectId: subj._id,
              },
            }
          )
          .then((r) => ({ subj, data: r.data.data || [] }))
          .catch((err) => {
            console.error(`Failed subject-wise for ${subj.name}`, err);
            toast.error(`Failed to load stats for ${subj.code || subj.name}`);
            return { subj, data: [] }; // recover with empty
          })
      );

      const subjResults = await Promise.all(subjPromises);

      // We'll build:
      // - studentsMap: { regNo: { regNo, name, phone, imageUrl, subjects: {subjectName: {attendedHours, heldHours, percent, sessions, batch}}, totalAttendedHours, totalHeldHours } }
      // - subjectMetaByYear
      const studentsMapByYear = {}; // { year: { regNo: studentObj } }
      const _subjectMetaByYear = {}; // { year: { subjectName: { totalHours, batchTotals } } }

      for (const { subj, data } of subjResults) {
        // Build allSessions for this subject (unique by date + timeSlot)
        const seen = new Set();
        const allSessions = [];
        (data || []).forEach((stu) => {
          (stu.sessions || []).forEach((s) => {
            const dateStr = new Date(s.date).toLocaleDateString("en-GB");
            const key = `${dateStr}_${s.timeSlot}`;
            if (!seen.has(key)) {
              seen.add(key);
              allSessions.push({
                date: dateStr,
                timeSlot: s.timeSlot,
                duration: getDuration(s.timeSlot),
                batch: normalizeBatch(s.batch),
                raw: s,
              });
            }
          });
        });

        // Compute subject-level totals + batch totals
        let totalUniqueHours = 0;
        const batchTotals = { B1: 0, B2: 0, Both: 0, Unknown: 0 };
        allSessions.forEach((s) => {
          totalUniqueHours += s.duration;
          if (s.batch === "Both") {
            batchTotals.Both += s.duration;
            batchTotals.B1 += s.duration;
            batchTotals.B2 += s.duration;
          } else if (s.batch === "B1") {
            batchTotals.B1 += s.duration;
          } else if (s.batch === "B2") {
            batchTotals.B2 += s.duration;
          } else {
            batchTotals.Unknown += s.duration;
          }
        });

        // Determine year label for this subject (prefer subj.semester, else filter semester)
        const sem = subj.semester ?? Number(filters.semester ?? 0);
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

        if (!_subjectMetaByYear[year]) _subjectMetaByYear[year] = {};
        _subjectMetaByYear[year][
          subj.name || subj.subjectName || subj.code || "Unknown Subject"
        ] = {
          totalHours: totalUniqueHours,
          batchTotals,
        };

        // For each student in the subject's returned data, compute their attended/held hours for this subject
        (data || []).forEach((stu) => {
          const regNo =
            stu.registerNumber || stu.regNo || stu.id || stu._id || "unknown";
          const studentBatch = normalizeBatch(stu.batch);
          // make session map of student's attendance status
          const sessionMap = {};
          (stu.sessions || []).forEach((s) => {
            const dateStr = new Date(s.date).toLocaleDateString("en-GB");
            sessionMap[`${dateStr}_${s.timeSlot}`] = s.status;
          });

          // compute held & attended by iterating subject allSessions (so that held includes sessions student was expected to attend)
          let held = 0;
          let attended = 0;
          allSessions.forEach((sess) => {
            // session applies to this student if session.batch === "Both" or session.batch === student's batch
            if (sess.batch === "Both" || sess.batch === studentBatch) {
              held += sess.duration;
              const status = sessionMap[`${sess.date}_${sess.timeSlot}`];
              if (status === "Present") {
                attended += sess.duration;
              }
            }
          });

          const percent = held > 0 ? Math.round((attended / held) * 100) : 0;

          // ensure map for year + student
          if (!studentsMapByYear[year]) studentsMapByYear[year] = {};
          if (!studentsMapByYear[year][regNo]) {
            studentsMapByYear[year][regNo] = {
              regNo,
              registerNumber: stu.registerNumber || stu.regNo || regNo,
              name: stu.name || stu.studentName || "-",
              phone: stu.phone || stu.contact || "-",
              imageUrl: stu.imageUrl || null,
              batch: studentBatch,
              subjects: {},
              totalHeldHours: 0,
              totalAttendedHours: 0,
            };
          }

          // add subject entry for this student
          const subjectName =
            subj.name || subj.subjectName || subj.code || "Unknown Subject";
          studentsMapByYear[year][regNo].subjects[subjectName] = {
            heldHours: toNum(held),
            attendedHours: toNum(attended),
            percent,
            sessions: stu.sessions || [],
            batch: studentBatch,
          };

          // add to totals
          studentsMapByYear[year][regNo].totalHeldHours += toNum(held);
          studentsMapByYear[year][regNo].totalAttendedHours += toNum(attended);
        });
      } // end for subjResults

      // Convert studentsMapByYear objects to arrays and compute final percentages
      const grouped = {};
      Object.entries(studentsMapByYear).forEach(([year, studentsObj]) => {
        const arr = Object.values(studentsObj).map((stu) => {
          const totalHeld = toNum(stu.totalHeldHours);
          const totalAtt = toNum(stu.totalAttendedHours);
          const overallPercent =
            totalHeld > 0 ? Math.round((totalAtt / totalHeld) * 100) : 0;
          return {
            ...stu,
            totalHeldHours: totalHeld,
            totalAttendedHours: totalAtt,
            overallPercent,
          };
        });
        grouped[year] = arr;
      });

      setGroupedByYear(grouped);
      setSubjectMetaByYear(_subjectMetaByYear);
    } catch (err) {
      console.error("Failed to build consolidated report:", err);
      toast.error("Failed to build consolidated report");
    } finally {
      setLoading(false);
    }
  }; // end fetchConsolidated

  useEffect(() => {
    if (filters.department && filters.semester && subjects.length > 0) {
      fetchConsolidated();
    }
  }, [filters.department, filters.semester, subjects]);

  // EXCEL exporters
  const downloadExcelAll = () => {
    const rows = [];
    Object.entries(groupedByYear).forEach(([year, students]) => {
      students.forEach((stu, i) => {
        const base = {
          Year: year,
          "Sl. No": i + 1,
          "Reg No": stu.registerNumber || stu.regNo,
          Name: stu.name,
          Phone: stu.phone,
          Batch: stu.batch,
        };

        // one cell per subject: "attended / held (percent%)"
        Object.keys(subjectMetaByYear[year] || {}).forEach((subjName) => {
          const info = stu.subjects?.[subjName];
          if (info) {
            base[
              subjName
            ] = `${info.attendedHours}h / ${info.heldHours}h (${info.percent}%)`;
          } else {
            base[subjName] = "-";
          }
        });

        rows.push(base);
      });
    });

    if (rows.length === 0) {
      toast.error("No data to download");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consolidated");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "ConsolidatedAttendance.xlsx");
  };

  const downloadExcelShortage = () => {
    const rows = [];
    Object.entries(groupedByYear).forEach(([year, students]) => {
      students.forEach((stu, i) => {
        const hasShortage = Object.keys(subjectMetaByYear[year] || {}).some(
          (subjName) => {
            const info = stu.subjects?.[subjName];
            return info && info.percent < 75;
          }
        );

        if (!hasShortage) return;

        const base = {
          Year: year,
          "Sl. No": i + 1,
          "Reg No": stu.registerNumber || stu.regNo,
          Name: stu.name,
          Phone: stu.phone || "-",
          Batch: stu.batch,
        };

        Object.keys(subjectMetaByYear[year] || {}).forEach((subjName) => {
          const info = stu.subjects?.[subjName];
          if (info) {
            base[
              subjName
            ] = `${info.attendedHours}h / ${info.heldHours}h (${info.percent}%)`;
          } else {
            base[subjName] = "-";
          }
        });

        rows.push(base);
      });

      // if there are any shortage rows for this year, build one sheet per year with heading rows
      if (rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows, { origin: "A4" }); // start data at row 4

        // add heading rows manually
        XLSX.utils.sheet_add_aoa(
          ws,
          [
            [`Karnataka (Govt.) Polytechnic, Mangalore - 103`],
            [`Department of (insert department)`],
            [`Shortage of Attendance for the Year ${year}`],
          ],
          { origin: "A1" }
        );

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Shortage ${year}`);
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/octet-stream",
        });
        saveAs(blob, `ShortageAttendance_${year}.xlsx`);
      } else {
        toast.error(`No shortage data for ${year}`);
      }
    });
  };

  const departments = [
    { value: "at", label: "AT" },
    { value: "ce", label: "CE" },
    { value: "ch", label: "CH" },
    { value: "cs", label: "CS" },
    { value: "ec", label: "EC" },
    { value: "eee", label: "EEE" },
    { value: "me", label: "ME" },
    { value: "po", label: "PO" },
    { value: "sc", label: "SC" },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">
        {dept} — Consolidated Attendance
      </h2>

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchConsolidated();
        }}
        className="flex flex-wrap gap-4 mb-6"
      >
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

        <select
          value={filters.semester}
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">Select Semester</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>

        {/* <select
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
        </select> */}
        <button
          type="submit"
          disabled={loading || subjectsLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading ? "Building report..." : "Fetch Consolidated"}
        </button>

        <button
          type="button"
          onClick={downloadExcelAll}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Download Excel
        </button>

        <button
          type="button"
          onClick={downloadExcelShortage}
          className="px-4 py-2 bg-red-600 text-white rounded-md"
        >
          Download Shortage
        </button>
      </form>

      {/* Loading / empty */}
      {subjectsLoading && (
        <p className="text-sm text-gray-600">{/* Loading subjects... */}</p>
      )}
      {/* Loading / empty */}
      {loading ? (
        <LoaderOverlay message="Building consolidated report..." />
      ) : Object.keys(groupedByYear).length === 0 ? (
        <p className="text-gray-600">No data available.</p>
      ) : null}

      {/* Tables grouped by year */}
      {!loading &&
        Object.entries(groupedByYear).map(([year, students]) => (
          <div
            key={year}
            className="mb-8 bg-white shadow rounded-lg overflow-auto"
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
                  <th className="px-4 py-2 border">Batch</th>

                  {/* dynamic subject headers for this year */}
                  {Object.entries(subjectMetaByYear[year] || {}).map(
                    ([subjName, meta]) => (
                      <th key={subjName} className="px-4 py-2 border">
                        <div className="font-medium">{subjName}</div>

                        <div className="text-xs text-gray-500">
                          {meta.batchTotals && (
                            <>
                              {meta.batchTotals.B1 ? (
                                <div>B1: {meta.batchTotals.B1}h</div>
                              ) : null}
                              {meta.batchTotals.B2 ? (
                                <div>B2: {meta.batchTotals.B2}h</div>
                              ) : null}
                            </>
                          )}
                        </div>
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {students.map((stu, i) => (
                  <tr
                    key={stu.regNo || stu.registerNumber || i}
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
                    <td className="px-4 py-2 border">
                      {stu.registerNumber || stu.regNo || stu.regNo}
                    </td>
                    <td className="px-4 py-2 border">{stu.name}</td>
                    <td className="px-4 py-2 border">{stu.phone || "-"}</td>
                    <td className="px-4 py-2 border">{stu.batch}</td>

                    {/* per-subject cells */}
                    {Object.keys(subjectMetaByYear[year] || {}).map(
                      (subjName) => {
                        const info = stu.subjects?.[subjName] ?? null;
                        const pct = info?.percent ?? 100;
                        return (
                          <td
                            key={subjName}
                            className={`px-4 py-2 border text-center ${
                              pct < 75
                                ? "bg-red-100 text-red-700 font-semibold"
                                : ""
                            }`}
                          >
                            {info ? (
                              <>
                                <div className="text-sm font-medium">
                                  {info.attendedHours}h / {info.heldHours}h
                                </div>
                                <div className="text-xs text-gray-600">
                                  {info.percent}%
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
