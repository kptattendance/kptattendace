"use client";

import React from "react";

export default function AdminStats() {
  // Replace with API data later
  const stats = [
    { dept: "Computer Science", total: 320, avg: 88 },
    { dept: "Electronics", total: 280, avg: 85 },
    { dept: "Mechanical", total: 300, avg: 82 },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">All Department Overview</h2>
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Department
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Total Students
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Avg Attendance (%)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {stats.map((s, i) => (
              <tr key={i}>
                <td className="px-6 py-4">{s.dept}</td>
                <td className="px-6 py-4">{s.total}</td>
                <td className="px-6 py-4">{s.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
