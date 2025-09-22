"use client";

import React from "react";
import HodStudentStats from "../hod/statistics/EachStudentAttendance";

export default function StudentReports() {
  // This is a placeholder; later you can fetch real reports
  const reports = [
    { dept: "CS", date: "2025-09-10", attendance: "87%" },
    { dept: "ECE", date: "2025-09-10", attendance: "84%" },
    { dept: "MECH", date: "2025-09-10", attendance: "82%" },
  ];

  return (
    <section>
      {/* <h2 className="text-2xl font-semibold mb-4">Attendance Reports</h2> */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <HodStudentStats />
      </div>
    </section>
  );
}
