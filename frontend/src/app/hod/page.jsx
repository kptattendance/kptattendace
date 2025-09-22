"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import HodSidebar from "@/components/hod/HodSidebar";
import AddStaffForm from "@/components/hod/AddStaffForm";
import AddStudentForm from "@/components/hod/AddStudentForm";
import AddSubjectForm from "@/components/hod/AddSubjectForm";
import AddTimetableForm from "@/components/hod/AddTimetableForm";
import StudentTable from "@/components/hod/StudentTable";
import AttendanceSessionForm from "@/components/attendance/AttendanceSessionForm";
import ConsolidatedAttendance from "@/components/hod/ConsolidatedAttendance";
import EachStudentAttendance from "@/components/hod/statistics/EachStudentAttendance";
import ClassesHandled from "@/components/hod/ClassesHandled";

export default function HODDashboardPage() {
  const [selected, setSelected] = useState("mark-attendance");
  const hodDepartment = "Computer Science";

  return (
    <div className="flex h-screen flex-col">
      {/* Top navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:block w-64 bg-white shadow-lg border-r">
          <HodSidebar selected={selected} setSelected={setSelected} />
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
              <option value="consolidated-attendance">
                Consolidated Attendance
              </option>
              <option value="each-student-attendance">
                Each Student Attendance
              </option>
              <option value="add-staff">Add Staff</option>
              <option value="add-student">Add Students</option>
              <option value="list-student">Students List</option>
              <option value="add-subject">Add Subject</option>
              <option value="timetable">Timetable</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          {/* Content area */}
          {selected === "mark-attendance" && <AttendanceSessionForm />}
          {selected === "consolidated-attendance" && (
            <ConsolidatedAttendance dept={hodDepartment} />
          )}
          {selected === "each-student-attendance" && <EachStudentAttendance />}
          {selected === "classes-handled" && <ClassesHandled />}
          {selected === "add-staff" && <AddStaffForm />}
          {selected === "add-student" && <AddStudentForm />}
          {selected === "list-student" && <StudentTable />}
          {selected === "add-subject" && <AddSubjectForm />}
          {selected === "timetable" && <AddTimetableForm />}
          {selected === "settings" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-2">Settings</h2>
              <p className="text-sm text-gray-600">
                HOD-level settings and preferences.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
