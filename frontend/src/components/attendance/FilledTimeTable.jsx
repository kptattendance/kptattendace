"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function FilledTimeTable({ refreshKey }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const hodDepartment = user?.publicMetadata?.department; // e.g., "cs"

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [semesterCounts, setSemesterCounts] = useState({});
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [totalPresentToday, setTotalPresentToday] = useState(0);
  const [students, setStudents] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // 1️⃣ Fetch all students
      const studentsRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/getstudents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allStudents = studentsRes.data.data || [];
      const deptStudents = allStudents.filter(
        (s) => s.department?.toLowerCase() === hodDepartment?.toLowerCase()
      );
      setStudents(deptStudents);

      // Semester-wise counts
      const semCounts = {};
      deptStudents.forEach((s) => {
        const sem = s.semester || "Unknown";
        semCounts[sem] = (semCounts[sem] || 0) + 1;
      });
      setSemesterCounts(semCounts);

      // 2️⃣ Fetch all sessions for this department
      const sessionsRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allSessions = sessionsRes.data.data || [];
      const deptSessions = allSessions.filter(
        (s) => s.department?.toLowerCase() === hodDepartment?.toLowerCase()
      );
      setSessions(deptSessions);

      const today = new Date().toISOString().slice(0, 10);
      const todaySessions = deptSessions.filter(
        (s) => s.date.slice(0, 10) === today
      );

      // 3️⃣ Calculate attendance for current session (nearest ongoing session)
      const now = new Date();
      let currentPresent = 0;
      let currentAbsent = 0;
      for (const s of todaySessions) {
        const [startStr, endStr] = s.timeSlot.split("-");
        const start = new Date(`${s.date.slice(0, 10)}T${startStr}:00`);
        const end = new Date(`${s.date.slice(0, 10)}T${endStr}:00`);
        if (now >= start && now <= end) {
          const attRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/session/${s._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const presentStudents = attRes.data.present || [];
          currentPresent += presentStudents.length;
        }
      }
      currentAbsent = deptStudents.length - currentPresent;
      setPresentCount(currentPresent);
      setAbsentCount(currentAbsent);

      // 4️⃣ Total present today across all sessions
      let totalPresent = 0;
      for (const s of todaySessions) {
        const attRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/session/${s._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        totalPresent += (attRes.data.present || []).length;
      }
      setTotalPresentToday(totalPresent);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  if (loading) return <div>Loading...</div>;

  // Timetable preparation (same as before)
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 9; h < 17; h++) {
      const start = h > 12 ? h - 12 : h;
      const end = h + 1 > 12 ? h + 1 - 12 : h + 1;
      const startSuffix = h >= 12 ? "PM" : "AM";
      const endSuffix = h + 1 >= 12 ? "PM" : "AM";
      slots.push(`${start}:00 ${startSuffix} - ${end}:00 ${endSuffix}`);
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  const dates = [...new Set(sessions.map((s) => s.date.slice(0, 10)))].sort();
  const timetableMap = {};
  dates.forEach((date) => {
    timetableMap[date] = {};
    timeSlots.forEach((slot) => (timetableMap[date][slot] = []));
  });

  sessions.forEach((s) => {
    const date = s.date.slice(0, 10);
    if (!s.timeSlot) return;
    const [startStr, endStr] = s.timeSlot.split("-");
    let startHour = parseInt(startStr.split(":")[0], 10);
    let endHour = parseInt(endStr.split(":")[0], 10);
    if (endHour <= startHour) endHour = startHour + 1;

    for (let h = startHour; h < endHour; h++) {
      const slotIndex = h - 9;
      if (slotIndex >= 0 && slotIndex < timeSlots.length) {
        const slot = timeSlots[slotIndex];
        timetableMap[date][slot].push({
          code: s.subjectId?.code || "",
          name: s.subjectId?.name || "",
          faculty: s.lecturerId?.name || s.lecturerName || "",
          batch: s.batch || "",
        });
      }
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <h1 className="text-2xl font-bold text-blue-700">
        Welcome, HOD of {hodDepartment?.toUpperCase()} Department
      </h1>

      {/* Semester-wise + Present / Absent / Total Present cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.keys(semesterCounts).map((sem) => (
          <div
            key={sem}
            className="bg-blue-100 p-4 rounded-lg shadow flex flex-col items-center"
          >
            <div className="text-sm font-medium">Semester {sem}</div>
            <div className="text-2xl font-bold">{semesterCounts[sem]}</div>
          </div>
        ))}

        <div className="bg-green-100 p-4 rounded-lg shadow flex flex-col items-center">
          <div className="text-sm font-medium">Present Now</div>
          <div className="text-2xl font-bold">{presentCount}</div>
        </div>

        <div className="bg-red-100 p-4 rounded-lg shadow flex flex-col items-center">
          <div className="text-sm font-medium">Absent Now</div>
          <div className="text-2xl font-bold">{absentCount}</div>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg shadow flex flex-col items-center">
          <div className="text-sm font-medium">Total Present Today</div>
          <div className="text-2xl font-bold">{totalPresentToday}</div>
          <div className="text-xs mt-1">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Timetable */}
      <div className="overflow-x-auto p-4 bg-white rounded-lg shadow-md">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Day / Date</th>
              {timeSlots.map((slot) => (
                <th key={slot} className="border p-2 text-left">
                  {slot}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => {
              const dayName = new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
              });
              return (
                <tr key={date} className="hover:bg-gray-50">
                  <td className="border p-2 font-medium">
                    {dayName} <br /> {date}
                  </td>
                  {timeSlots.map((slot) => (
                    <td key={slot} className="border p-2 align-top">
                      {timetableMap[date][slot].map((s, idx) => (
                        <div
                          key={idx}
                          className="mb-1 p-1 rounded bg-blue-100 text-blue-900"
                        >
                          <div className="font-semibold">
                            {s.code} — {s.name}{" "}
                            {s.batch && `(Batch ${s.batch})`}
                          </div>
                          <div className="text-xs">{s.faculty}</div>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
