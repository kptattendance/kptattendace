"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AddHODForm from "@/components/admin/AddHODForm";
import AdminHODList from "@/components/admin/AdminHodList";
import AdminStaffList from "@/components/admin/AdminStaffList";
import AdminStudentList from "@/components/admin/AdminStudentList";
import AdminSubjectList from "@/components/admin/AdminSubjectList";
import StudentReports from "@/components/admin/StudentReports";
import AdminTimeTable from "@/components/admin/AdminTimeTable";
import ConsolidatedAttendance from "@/components/hod/ConsolidatedAttendance";

export default function AdminDashboardPage() {
  const [selected, setSelected] = useState("stats");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-gray-100 border-r">
          <div className="flex-1 overflow-y-auto">
            <AdminSidebar selected={selected} setSelected={setSelected} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 py-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {selected === "stats" && <AdminTimeTable />}
            {selected === "add-hod" && <AddHODForm />}
            {selected === "hod-list" && <AdminHODList />}
            {selected === "staff-list" && <AdminStaffList />}
            {selected === "student-list" && <AdminStudentList />}
            {selected === "subject-list" && <AdminSubjectList />}
            {selected === "reports" && <StudentReports />}
            {selected === "consolidated-attendance" && (
              <ConsolidatedAttendance />
            )}
            {selected === "settings" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-2">Settings</h2>
                <p className="text-sm text-gray-600">
                  Admin-level settings and preferences.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
