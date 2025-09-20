"use client";

import React, { useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";
import LoaderOverlay from "../LoaderOverlay";
import StudentTable from "./StudentTable";

const departments = [
  { value: "cs", label: "Computer Science Engineering" },
  { value: "ce", label: "Civil Engineering" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "ec", label: "Electronics & Communication Engineering" },
  { value: "eee", label: "Electrical & Electronics Engineering" },
  { value: "ch", label: "Chemical Engineering" },
  { value: "po", label: "Polymer Engineering" },
  { value: "at", label: "Automobile Engineering" },
  { value: "sc", label: "Science and English" },
];

// ✅ Only 6 semesters
const semesters = Array.from({ length: 6 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}`,
}));

export default function StudentForm() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const role = user?.publicMetadata?.role;
  const hodDepartment = user?.publicMetadata?.department;

  const isScienceHOD = role === "hod" && hodDepartment === "sc";

  const [form, setForm] = useState({
    registerNumber: "",
    name: "",
    email: "",
    phone: "",
    department: hodDepartment || "",
    semester: "",
    role: "student",
    image: null,
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files) {
      setForm({ ...form, image: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isScienceHOD) {
      toast.error("❌ Science HOD cannot add students.");
      return;
    }

    setStatus("saving");

    try {
      // 🔹 Transform form fields to uppercase except email
      const transformedForm = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          if (
            typeof value === "string" &&
            key !== "email" // keep email as is
          ) {
            return [key, value.toUpperCase()];
          }
          return [key, value];
        })
      );

      const formData = new FormData();
      Object.entries(transformedForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // 🔹 Force department for HODs
      if (role === "hod") {
        formData.set("department", hodDepartment);
      }

      const token = await getToken();
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/addstudent`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("✅ Student added successfully!");
      setForm({
        registerNumber: "",
        name: "",
        email: "",
        phone: "",
        department: hodDepartment || "",
        semester: "",
        role: "student",
        image: null,
      });
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "❌ Failed to add student";
      toast.error(message);
    } finally {
      setStatus(null);
    }
  };

  return (
    <section className="relative">
      {status === "saving" && <LoaderOverlay message="Adding student..." />}

      <h2 className="text-2xl font-semibold mb-4">Add Student</h2>

      {isScienceHOD ? (
        <p className="text-red-600 font-medium mb-4">
          ⚠️ Science & English HOD cannot add students.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white p-6 rounded-lg shadow"
        >
          <input
            name="registerNumber"
            value={form.registerNumber}
            onChange={handleChange}
            placeholder="Register Number"
            required
            className="block w-full rounded-md border px-3 py-2"
          />

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            required
            className="block w-full rounded-md border px-3 py-2"
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="block w-full rounded-md border px-3 py-2"
          />

          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            required
            className="block w-full rounded-md border px-3 py-2"
          />

          {/* Department field */}
          {role === "hod" ? (
            <input
              value={
                departments.find((d) => d.value === hodDepartment)?.label ||
                hodDepartment
              }
              disabled
              className="block w-full rounded-md border px-3 py-2 bg-gray-100 text-gray-600"
            />
          ) : (
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              className="block w-full rounded-md border px-3 py-2"
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          )}

          {/* Semester field */}
          <select
            name="semester"
            value={form.semester}
            onChange={handleChange}
            required
            className="block w-full rounded-md border px-3 py-2"
          >
            <option value="">Select a semester</option>
            {semesters.map((sem) => (
              <option key={sem.value} value={sem.value}>
                {sem.label}
              </option>
            ))}
          </select>

          {/* Profile Image */}
          <div className="flex items-center gap-4">
            {form.image ? (
              <img
                src={URL.createObjectURL(form.image)}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 border">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <label className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border cursor-pointer hover:bg-blue-100 transition">
              <Upload className="w-5 h-5 inline-block mr-2" />
              Upload
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Add Student
          </button>
        </form>
      )}
    </section>
  );
}
