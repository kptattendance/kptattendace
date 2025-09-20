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
    departments: [],
  });
  const [status, setStatus] = useState(null);

  // 🔄 state to trigger refresh of table
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔒 Auto-lock department if user is HOD
  useEffect(() => {
    if (myRole === "hod" && myDept) {
      setForm((f) => ({ ...f, departments: [myDept] }));
    }
  }, [myRole, myDept]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleDepartmentsChange = (e) => {
    const { options } = e.target;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setForm({ ...form, departments: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");

    try {
      const token = await getToken();

      // Extract dept code from subject code (e.g. 20EC54I → EC)
      const codeDept = form.code.match(/[A-Z]{2,3}/)?.[0];

      if (!codeDept) {
        throw new Error("❌ Invalid subject code format");
      }

      // Restrict HODs
      if (myRole === "hod") {
        if (myDept !== codeDept) {
          throw new Error(
            `❌ You are ${myDept} HOD. You can only add subjects with code containing "${myDept}", but you entered "${codeDept}".`
          );
        }
        if (!form.departments.includes(myDept)) {
          throw new Error(
            `❌ Department must be locked to ${myDept}. Cannot assign other departments.`
          );
        }
      }

      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        name: form.name.trim(),
        semester: Number(form.semester),
        departments: form.departments.map((d) => d.toUpperCase()),
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subjects/addsubject`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("✅ Subject added successfully!");

      // reset form
      setForm({
        code: "",
        name: "",
        semester: "",
        departments: myRole === "hod" && myDept ? [myDept] : [],
      });

      // 🔄 trigger table refresh
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
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
        {/* Code */}
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Subject code (e.g., 20EC54I)"
          required
          className="block w-full rounded-md border px-3 py-2"
        />

        {/* Name */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Subject name"
          required
          className="block w-full rounded-md border px-3 py-2"
        />

        {/* Semester */}
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

        {/* Departments */}
        {myRole === "hod" ? (
          <input
            value={myDept}
            disabled
            className="block w-full rounded-md border px-3 py-2 bg-gray-100"
          />
        ) : (
          <select
            name="departments"
            multiple
            value={form.departments}
            onChange={handleDepartmentsChange}
            required
            className="block w-full rounded-md border px-3 py-2 bg-gray-50"
          >
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

      {/* pass refreshKey */}
      <SubjectTable refreshKey={refreshKey} />
    </section>
  );
}
