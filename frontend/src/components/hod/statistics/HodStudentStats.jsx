"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import StudentStats from "./StudentStats";

export default function HodStudentStats() {
  const { getToken } = useAuth();
  const [filters, setFilters] = useState({
    department: "",
    semester: "",
    registerNumber: "",
  });
  const [student, setStudent] = useState(null);

  const searchStudent = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/search`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: filters,
        }
      );
      if (!res.data || res.data.length === 0) {
        toast.error("No student found");
        setStudent(null);
        return;
      }
      setStudent(res.data[0]); // pick first match
    } catch (err) {
      console.error("Failed to search student:", err);
      toast.error("Failed to search student");
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">
        🎓 HOD — Student Attendance Stats
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchStudent();
        }}
        className="flex flex-wrap gap-4 mb-6"
      >
        <select
          value={filters.department}
          onChange={(e) =>
            setFilters({ ...filters, department: e.target.value })
          }
          className="border px-3 py-2 rounded-md"
        >
          <option value="">Select Department</option>
          <option value="cs">CSE</option>
          <option value="ec">ECE</option>
          <option value="me">ME</option>
        </select>

        <select
          value={filters.semester}
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Semesters</option>
          {[...Array(8)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Semester {i + 1}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={filters.registerNumber}
          onChange={(e) =>
            setFilters({ ...filters, registerNumber: e.target.value })
          }
          placeholder="Register Number"
          className="border px-3 py-2 rounded-md"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Search
        </button>
      </form>

      {student && (
        <>
          <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Student Info</h3>
            <p>
              <strong>Name:</strong> {student.name}
            </p>
            <p>
              <strong>Reg No:</strong> {student.registerNumber}
            </p>
            <p>
              <strong>Department:</strong> {student.department}
            </p>
            <p>
              <strong>Semester:</strong> {student.semester}
            </p>
          </div>

          <StudentStats studentId={student._id} />
        </>
      )}
    </section>
  );
}
