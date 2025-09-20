"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import StaffSidebar from "@/components/staff/StaffSidebar";
import AttendanceSessionForm from "@/components/attendance/AttendanceSessionForm";
import SubjectStatistics from "@/components/staff/SubjectStatistics";

export default function StaffDashboardPage() {
  const [selected, setSelected] = useState("mark-attendance");

  return (
    <div className="flex h-screen flex-col">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:block w-64 bg-white shadow-lg border-r">
          <StaffSidebar selected={selected} setSelected={setSelected} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {/* Mobile dropdown */}
          <div className="md:hidden mb-4">
            <select
              className="w-full rounded-md border px-3 py-2 shadow-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="mark-attendance">Mark Attendance</option>
              <option value="sub-attendance">Subject Attendance</option>
              {/* <option value="subjects">Subjects</option>
              <option value="settings">Settings</option> */}
            </select>
          </div>

          {/* Dynamic content */}
          {selected === "mark-attendance" && <AttendanceSessionForm />}
          {selected === "sub-attendance" && <SubjectStatistics />}
          {/* {selected === "subjects" && <SubjectList />}
          {selected === "settings" && <StaffSettings />} */}
        </main>
      </div>
    </div>
  );
}
