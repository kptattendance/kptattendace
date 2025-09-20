"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export default function FilledTimeTable({ refreshKey }) {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const arr = res.data.data || res.data || [];
      setSessions(arr);
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

  // Generate 1-hour time slots from 9AM to 5PM
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

  // Get unique dates from sessions
  const dates = [...new Set(sessions.map((s) => s.date.slice(0, 10)))].sort();
  const timetableMap = {};
  dates.forEach((date) => {
    timetableMap[date] = {};
    timeSlots.forEach((slot) => {
      timetableMap[date][slot] = null;
    });
  });
  // Map sessions to date + hour slot
  // const timetableMap = {};
  sessions.forEach((s) => {
    const date = s.date.slice(0, 10);

    if (!s.timeSlot) return; // safety check
    const [startStr, endStr] = s.timeSlot.split("-"); // e.g., "15:00-17:00"
    let startHour = parseInt(startStr.split(":")[0], 10);
    let endHour = parseInt(endStr.split(":")[0], 10);

    if (endHour <= startHour) endHour = startHour + 1; // safety for invalid slots

    for (let h = startHour; h < endHour; h++) {
      const slotIndex = h - 9; // 9AM = index 0
      if (slotIndex >= 0 && slotIndex < timeSlots.length) {
        const slot = timeSlots[slotIndex];
        timetableMap[date][slot] = {
          code: s.subjectId?.code || "",
          name: s.subjectId?.name || "",
          faculty: s.lecturerId?.name || s.lecturerName || "",
        };
      }
    }
  });

  return (
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
                {timeSlots.map((slot) => {
                  const s = timetableMap[date][slot];
                  return (
                    <td key={slot} className="border p-2 align-top">
                      {s && (
                        <div className="mb-1 p-1 rounded bg-blue-100 text-blue-900">
                          <div className="font-semibold">
                            {s.code} — {s.name}
                          </div>
                          <div className="text-xs">{s.faculty}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
