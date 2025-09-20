"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";
import LoaderOverlay from "../LoaderOverlay";
import StaffTable from "./StaffTable";

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

export default function AddStaffForm() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const myRole = user?.publicMetadata?.role;
  const myDept = user?.publicMetadata?.department;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "staff",
    image: null,
  });
  const [status, setStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔒 Auto-lock department if user is HOD
  useEffect(() => {
    if (myRole === "hod" && myDept) {
      setForm((f) => ({ ...f, department: myDept }));
    }
  }, [myRole, myDept]);

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
    setStatus("saving");

    try {
      // Transform data (uppercase except email, role, dept)
      const transformedForm = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          if (
            typeof value === "string" &&
            key !== "email" &&
            key !== "role" &&
            key !== "department"
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

      const token = await getToken();
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/adduser`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("✅ Staff added successfully!");
      setForm({
        name: "",
        email: "",
        phone: "",
        department: myRole === "hod" ? myDept : "",
        role: "staff",
        image: null,
      });
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "❌ Failed to add staff member"
      );
    } finally {
      setStatus(null);
    }
  };

  return (
    <section className="relative">
      {status === "saving" && <LoaderOverlay message="Adding staff..." />}

      <h2 className="text-2xl font-semibold mb-4">Add Staff</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow"
      >
        {/* Name */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name"
          required
          className="block w-full rounded-md border px-3 py-2"
        />

        {/* Email */}
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="block w-full rounded-md border px-3 py-2"
        />

        {/* Phone */}
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          required
          className="block w-full rounded-md border px-3 py-2"
        />

        {/* Department (locked if HOD) */}
        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          required
          disabled={myRole === "hod"}
          className="block w-full rounded-md border px-3 py-2 bg-gray-50"
        >
          <option value="">Select a department</option>
          {departments.map((dept) => (
            <option key={dept.value} value={dept.value}>
              {dept.label}
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
          Add Staff
        </button>
      </form>

      {/* Table */}
      <StaffTable key={refreshKey} />
    </section>
  );
}
