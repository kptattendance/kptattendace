"use client";

import Navbar from "@/components/Navbar";
import MySubjectStatistics from "@/components/student/MySubjectStatistics";

export default function StudentDashboard() {
  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">🎓 Student Dashboard</h1>

        {/* Dashboard Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Timetable placeholder */}
          <div className="p-6 bg-blue-100 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">📅 View Timetable</h2>
            <p className="text-gray-700 text-sm">
              Timetable integration coming soon.
            </p>
          </div>

          {/* Notices placeholder */}
          <div className="p-6 bg-yellow-100 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">📢 Notices</h2>
            <p className="text-gray-700 text-sm">
              Important announcements will appear here.
            </p>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="mt-10">
          <MySubjectStatistics />
        </div>
      </main>
    </div>
  );
}
