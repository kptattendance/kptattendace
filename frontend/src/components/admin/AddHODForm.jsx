"use client";

import React, { useState } from "react";
import axios from "axios";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner"; // 👈 import toast
import HODTable from "./HODTable";
import LoaderOverlay from "../LoaderOverlay";

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

export default function AddHODForm() {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "hod",
    image: null,
  });
  const [status, setStatus] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
      const transformedForm = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          if (
            typeof value === "string" &&
            key !== "email" &&
            key !== "phone" &&
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
      if (form.image) formData.set("image", form.image);

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

      toast.success(`${transformedForm.role} added successfully! ✅`);

      setForm({
        name: "",
        email: "",
        phone: "",
        department: "",
        role: "hod",
        image: null,
      });
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Add member error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "❌ Failed to add member";
      toast.error(message);
    } finally {
      // Always clear loader
      setStatus(null);
    }
  };

  return (
    <section className="relative">
      {/* Loader with fixed JSX bug */}
      {status === "saving" && (
        <LoaderOverlay message={`Adding ...${form.role}`} />
      )}

      <h2 className="text-2xl font-semibold mb-4">Add HOD</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border px-3 py-2"
          >
            <option value="">Select a department</option>
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          >
            <option value="hod">HOD</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Image
          </label>
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
            <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">Upload</span>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Add a Member
          </button>
        </div>
      </form>

      {/* Table refresh */}
      <HODTable key={refreshKey} />
    </section>
  );
}
