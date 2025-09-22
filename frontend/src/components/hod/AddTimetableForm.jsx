"use client";

import React, { useState } from "react";
import FilledTimetable from "../attendance/FilledTimeTable";

export default function AddTimetableForm() {
  const [rows, setRows] = useState([
    { day: "Monday", start: "09:00", duration: "1", subject: "", staff: "" },
  ]);
  const [status, setStatus] = useState(null);

  function updateRow(i, key, value) {
    const n = [...rows];
    n[i][key] = value;
    setRows(n);
  }
  function addRow() {
    setRows([
      ...rows,
      { day: "Monday", start: "09:00", duration: "1", subject: "", staff: "" },
    ]);
  }
  function removeRow(i) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus("saving");
    // TODO: POST to /api/hod/timetable
    await new Promise((r) => setTimeout(r, 700));
    setStatus("saved");
  }

  return (
    <section>
      <FilledTimetable />
      <h2 className="text-2xl font-semibold mb-4">
        Add Department Timetable.....
      </h2>

      <form
        onSubmit={handleSave}
        className="space-y-4 bg-white p-4 rounded-lg shadow"
      >
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
          >
            <div>
              <label className="text-sm">Day</label>
              <select
                value={row.day}
                onChange={(e) => updateRow(i, "day", e.target.value)}
                className="mt-1 block w-full rounded-md border px-2 py-1"
              >
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
              </select>
            </div>

            <div>
              <label className="text-sm">Start</label>
              <input
                type="time"
                value={row.start}
                onChange={(e) => updateRow(i, "start", e.target.value)}
                className="mt-1 block w-full rounded-md border px-2 py-1"
              />
            </div>

            <div>
              <label className="text-sm">Duration (hrs)</label>
              <select
                value={row.duration}
                onChange={(e) => updateRow(i, "duration", e.target.value)}
                className="mt-1 block w-full rounded-md border px-2 py-1"
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm">Subject</label>
              <input
                value={row.subject}
                onChange={(e) => updateRow(i, "subject", e.target.value)}
                className="mt-1 block w-full rounded-md border px-2 py-1"
              />
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-sm">Staff</label>
              <input
                value={row.staff}
                onChange={(e) => updateRow(i, "staff", e.target.value)}
                className="mt-1 block w-full rounded-md border px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="px-3 py-1 text-sm rounded bg-red-100 text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={addRow}
            className="px-4 py-2 bg-gray-100 rounded"
          >
            Add Row
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {status === "saving" ? "Saving…" : "Save Timetable"}
          </button>
          {status === "saved" && (
            <span className="text-sm text-green-600">Saved (demo)</span>
          )}
        </div>
      </form>
    </section>
  );
}
