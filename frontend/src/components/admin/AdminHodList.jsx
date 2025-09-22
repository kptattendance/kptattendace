"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LoaderOverlay from "../LoaderOverlay";

export default function AdminHODList() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);

  // fetch HODs + Admins
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/getusers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.filter((u) => u.role === "hod" || u.role === "admin"));
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // delete user
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      setAction("deleting");
      const token = await getToken();
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/deleteuser/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.filter((u) => u._id !== id));
      toast.success("✅ Member deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("❌ Failed to delete user");
    } finally {
      setAction(null);
    }
  };

  // save updated user (including image)
  // save updated user (including image)
  const handleSave = async (user) => {
    try {
      setAction("updating");
      const token = await getToken();

      // 🔹 Transform fields to uppercase except email & phone
      const transformedData = {
        name:
          typeof user.editData.name === "string"
            ? user.editData.name.toUpperCase()
            : user.editData.name,
        email: user.editData.email, // don't uppercase email
        phone: user.editData.phone, // don't uppercase phone
        department:
          typeof user.editData.department === "string"
            ? user.editData.department.toUpperCase()
            : user.editData.department,
      };

      const formData = new FormData();
      formData.append("name", transformedData.name);
      formData.append("email", transformedData.email);
      formData.append("phone", transformedData.phone);
      formData.append("department", transformedData.department);

      if (user.editData.imageFile) {
        formData.append("image", user.editData.imageFile); // 👈 file for Cloudinary
      }

      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/updateuser/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // update state with new user
      setUsers(
        users.map((u) =>
          u._id === user._id ? { ...res.data.data, isEditing: false } : u
        )
      );
      toast.success("✅ User updated successfully");
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("❌ Failed to update user");
    } finally {
      setAction(null);
    }
  };

  if (loading) return <p>Loading members...</p>;

  return (
    <div className="mt-10 relative">
      {/* Loader Overlay */}
      {action && (
        <LoaderOverlay
          message={action === "deleting" ? "Deleting..." : "Updating..."}
        />
      )}

      <h2 className="text-xl font-semibold mb-4">List of HODs & Admins</h2>

      {/* Responsive wrapper */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Sl. No.</th>
              <th className="p-2">Image</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Department</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id} className="border-t">
                {/* Sl. No. */}
                <td className="p-2 text-gray-600">{index + 1}</td>
                {/* Image */}
                <td className="p-2">
                  {user.isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setUsers(
                            users.map((u) =>
                              u._id === user._id
                                ? {
                                    ...u,
                                    editData: {
                                      ...u.editData,
                                      imageFile: e.target.files[0],
                                      preview: URL.createObjectURL(
                                        e.target.files[0]
                                      ),
                                    },
                                  }
                                : u
                            )
                          )
                        }
                      />
                      {user.editData.preview && (
                        <img
                          src={user.editData.preview}
                          alt="preview"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <img
                      src={user.imageUrl || "/default-avatar.png"}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                </td>

                {/* Name */}
                <td className="p-2">
                  {user.isEditing ? (
                    <input
                      type="text"
                      value={user.editData.name}
                      onChange={(e) =>
                        setUsers(
                          users.map((u) =>
                            u._id === user._id
                              ? {
                                  ...u,
                                  editData: {
                                    ...u.editData,
                                    name: e.target.value,
                                  },
                                }
                              : u
                          )
                        )
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    user.name
                  )}
                </td>

                {/* Email */}
                <td className="p-2">
                  {user.isEditing ? (
                    <input
                      type="email"
                      value={user.editData.email}
                      onChange={(e) =>
                        setUsers(
                          users.map((u) =>
                            u._id === user._id
                              ? {
                                  ...u,
                                  editData: {
                                    ...u.editData,
                                    email: e.target.value,
                                  },
                                }
                              : u
                          )
                        )
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    user.email
                  )}
                </td>

                {/* Phone */}
                <td className="p-2">
                  {user.isEditing ? (
                    <input
                      type="tel"
                      value={user.editData.phone}
                      onChange={(e) =>
                        setUsers(
                          users.map((u) =>
                            u._id === user._id
                              ? {
                                  ...u,
                                  editData: {
                                    ...u.editData,
                                    phone: e.target.value,
                                  },
                                }
                              : u
                          )
                        )
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    user.phone
                  )}
                </td>

                {/* Department */}
                <td className="p-2 uppercase">
                  {user.isEditing ? (
                    <select
                      value={user.editData.department}
                      onChange={(e) =>
                        setUsers(
                          users.map((u) =>
                            u._id === user._id
                              ? {
                                  ...u,
                                  editData: {
                                    ...u.editData,
                                    department: e.target.value,
                                  },
                                }
                              : u
                          )
                        )
                      }
                      className="border px-2 py-1 rounded w-full"
                    >
                      <option value="at">Automobile Engineering</option>
                      <option value="ch">Chemical Engineering</option>
                      <option value="ce">Civil Engineering</option>
                      <option value="cs">Computer Science Engineering</option>
                      <option value="ec">
                        Electronics & Communication Engineering
                      </option>
                      <option value="eee">
                        Electrical & Electronics Engineering
                      </option>
                      <option value="me">Mechanical Engineering</option>
                      <option value="po">Polymer Engineering</option>
                      <option value="sc">Science and English</option>
                    </select>
                  ) : (
                    user.department
                  )}
                </td>

                {/* Role */}
                <td className="p-2 capitalize">{user.role}</td>

                {/* Actions */}
                <td className="p-2 flex gap-2">
                  {user.isEditing ? (
                    <>
                      <button
                        className="px-2 py-1 bg-green-500 text-white rounded"
                        onClick={() => handleSave(user)}
                      >
                        Save
                      </button>
                      <button
                        className="px-2 py-1 bg-gray-400 text-white rounded"
                        onClick={() =>
                          setUsers(
                            users.map((u) =>
                              u._id === user._id
                                ? { ...u, isEditing: false }
                                : u
                            )
                          )
                        }
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      onClick={() =>
                        setUsers(
                          users.map((u) =>
                            u._id === user._id
                              ? { ...u, isEditing: true, editData: { ...u } }
                              : u
                          )
                        )
                      }
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    onClick={() => handleDelete(user._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No HODs or Admins found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
