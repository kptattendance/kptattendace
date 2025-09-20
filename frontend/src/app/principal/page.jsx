"use client";

import Navbar from "@/components/Navbar";

export default function PrincipalDashboard() {
  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Principal Dashboard</h1>
        <ul className="space-y-3">
          <li className="p-4 bg-blue-100 rounded shadow">
            📊 Department Attendance Overview
          </li>
          <li className="p-4 bg-green-100 rounded shadow">
            📈 Performance Analytics
          </li>
          <li className="p-4 bg-yellow-100 rounded shadow">📝 Approvals</li>
        </ul>
      </main>
    </div>
  );
}
