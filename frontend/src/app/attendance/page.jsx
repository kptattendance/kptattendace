"use client";

import AttendanceSessionForm from "@/components/attendance/AttendanceSessionForm";
import AttendanceSessionTable from "@/components/attendance/AttendanceSessionTable";
import { useState } from "react";

export default function AttendancePage() {
  const [key, setKey] = useState(0);
  return (
    <div className="max-w-6xl mx-auto p-4">
      <AttendanceSessionForm onCreated={() => setKey((k) => k + 1)} />
      <div className="mt-6">
        <AttendanceSessionTable refreshKey={key} />
      </div>
    </div>
  );
}
