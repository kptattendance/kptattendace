"use client";

import React from "react";

export default function ReportsPage() {
  // This is a placeholder; later you can fetch real reports
  const reports = [
    { dept: "CS", date: "2025-09-10", attendance: "87%" },
    { dept: "ECE", date: "2025-09-10", attendance: "84%" },
    { dept: "MECH", date: "2025-09-10", attendance: "82%" },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Attendance Reports</h2>
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Department
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Attendance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {reports.map((r, i) => (
              <tr key={i}>
                <td className="px-6 py-4">{r.dept}</td>
                <td className="px-6 py-4">{r.date}</td>
                <td className="px-6 py-4">{r.attendance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
