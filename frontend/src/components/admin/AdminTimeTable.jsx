"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export default function AdminTimeTable({ refreshKey }) {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("all");

  const departments = [
    { value: "all", label: "All" },
    { value: "at", label: "AT" },
    { value: "ch", label: "CH" },
    { value: "ce", label: "CE" },
    { value: "cs", label: "CS" },
    { value: "ec", label: "EC" },
    { value: "eee", label: "EEE" },
    { value: "me", label: "ME" },
    { value: "po", label: "PO" },
    { value: "sc", label: "SC" },
  ];

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  if (loading) return <div>Loading...</div>;

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

  // Filter sessions by single `department` string
  const filteredSessions =
    deptFilter === "all"
      ? sessions
      : sessions.filter(
          (s) => s.department?.toLowerCase() === deptFilter.toLowerCase()
        );

  const dates = [
    ...new Set(filteredSessions.map((s) => s.date.slice(0, 10))),
  ].sort();

  const timetableMap = {};
  dates.forEach((date) => {
    timetableMap[date] = {};
    timeSlots.forEach((slot) => (timetableMap[date][slot] = null));
  });

  filteredSessions.forEach((s) => {
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
        if (!timetableMap[date][slot]) timetableMap[date][slot] = [];
        timetableMap[date][slot].push({
          code: s.subjectId?.code || "",
          name: s.subjectId?.name || "",
          faculty: s.lecturerId?.name || s.lecturerName || "",
          batch: s.batch || "", // optional if you want batch info
        });
      }
    }
  });

  return (
    <div className="overflow-x-auto p-4 bg-white rounded-lg shadow-md">
      {/* Department Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {departments.map((d) => (
          <button
            key={d.value}
            onClick={() => setDeptFilter(d.value)}
            className={`px-3 py-1 rounded ${
              deptFilter === d.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Timetable Table */}
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
                {timeSlots.map((slot) => {
                  return (
                    <td key={slot} className="border p-2 align-top">
                      {timetableMap[date][slot]?.map((s, idx) => (
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
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {dates.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No sessions found for this department.
        </p>
      )}
    </div>
  );
}
