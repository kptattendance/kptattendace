"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import StudentStats from "./StudentStats";

export default function EachStudentAttendance() {
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
      console.log(res.data);
      setStudent(res.data[0]); // pick first match
    } catch (err) {
      console.error("Failed to search student:", err);
      toast.error("Failed to search student");
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold p-2 mb-4">
        🎓 Student Attendance Report
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchStudent();
        }}
        className="flex flex-wrap gap-4 mb-6 pl-2"
      >
        <select
          value={filters.department}
          onChange={(e) =>
            setFilters({ ...filters, department: e.target.value })
          }
          className="border px-3 py-2 rounded-md"
        >
          <option value="">Select Department</option>
          <option value="at">AT</option>
          <option value="ce">CE</option>
          <option value="ch">CH</option>
          <option value="cs">CSE</option>
          <option value="ec">ECE</option>
          <option value="eee">EEE</option>
          <option value="me">ME</option>
          <option value="po">PO</option>
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
          <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow flex items-center gap-6">
            {/* ✅ Student Image */}
            <div className="flex-shrink-0">
              {student.imageUrl ? (
                <img
                  src={student.imageUrl}
                  alt={student.name}
                  className="w-24 h-24 rounded-full object-cover border border-gray-300 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  No Image
                </div>
              )}
            </div>

            {/* ✅ Student Details */}
            <div>
              <h3 className="text-lg font-medium mb-2">Student Info</h3>
              <p>
                <strong>Name:</strong> {student.name}
              </p>
              <p>
                <strong>Reg No:</strong> {student.registerNumber}
              </p>
              <p>
                <strong>Department:</strong> {student.department?.toUpperCase()}
              </p>
              <p>
                <strong>Semester:</strong> {student.semester}
              </p>
              {student.phone && (
                <p>
                  <strong>Phone:</strong> {student.phone}
                </p>
              )}
            </div>
          </div>

          <StudentStats studentId={student._id} />
        </>
      )}
    </section>
  );
}
