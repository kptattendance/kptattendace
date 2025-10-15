"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import LoaderOverlay from "../LoaderOverlay";
import SubjectTable from "./SubjectTable";

const departments = [
  { value: "at", label: "Automobile Engineering" },
  { value: "ch", label: "Chemical Engineering" },
  { value: "ce", label: "Civil Engineering" },
  { value: "cs", label: "Computer Science Engineering" },
  { value: "ec", label: "Electronics & Communication Engineering" },
  { value: "eee", label: "Electrical & Electronics Engineering" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "po", label: "Polymer Engineering" },
  { value: "sc", label: "Science and English" },
];

export default function AddSubjectForm() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const myRole = user?.publicMetadata?.role;
  const myDept = user?.publicMetadata?.department?.toUpperCase();

  const [form, setForm] = useState({
    code: "",
    name: "",
    semester: "",
    department: "",
  });
  const [status, setStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (myRole === "hod" && myDept) {
      setForm((f) => ({ ...f, department: myDept }));
    }
  }, [myRole, myDept]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");

    try {
      const token = await getToken();
      const codeDept = form.code.match(/[A-Z]{2,3}/)?.[0];
      if (!codeDept) throw new Error("❌ Invalid subject code format");

      if (myRole === "hod" && form.department !== myDept) {
        throw new Error(`❌ Department must be locked to ${myDept}`);
      }

      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        name: form.name.trim(),
        semester: Number(form.semester),
        department: form.department.toUpperCase(),
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/addsubject`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Subject added successfully!");
      setForm({
        code: "",
        name: "",
        semester: "",
        department: myRole === "hod" && myDept ? myDept : "",
      });

      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err.message);
      toast.error(err.message || "❌ Failed to add subject");
    } finally {
      setStatus(null);
    }
  };

  return (
    <section className="relative">
      {status === "saving" && <LoaderOverlay message="Adding subject..." />}

      <h2 className="text-2xl font-semibold mb-4">Add Subject</h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow"
      >
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Subject code (e.g., 20EC54I)"
          required
          className="block w-full rounded-md border px-3 py-2"
        />

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Subject name"
          required
          className="block w-full rounded-md border px-3 py-2"
        />

        <select
          name="semester"
          value={form.semester}
          onChange={handleChange}
          required
          className="block w-full rounded-md border px-3 py-2"
        >
          <option value="">Select Semester</option>
          {[1, 2, 3, 4, 5, 6].map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>

        {myRole === "hod" ? (
          <input
            value={myDept}
            disabled
            className="block w-full rounded-md border px-3 py-2 bg-gray-100"
          />
        ) : (
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            className="block w-full rounded-md border px-3 py-2 bg-gray-50"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Add Subject
        </button>
      </form>

      <SubjectTable refreshKey={refreshKey} />
    </section>
  );
}
