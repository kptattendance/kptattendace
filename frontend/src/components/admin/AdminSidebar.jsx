"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { BarChart3, UserPlus, FileText, Settings } from "lucide-react";

export default function AdminSidebar({ selected, setSelected }) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [adminInfo, setAdminInfo] = useState(null);

  // ✅ Fetch Admin details from backend
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        if (!user?.id) return;
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/getuser/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAdminInfo(res.data.data || res.data);
      } catch (err) {
        console.error("Error fetching Admin details:", err);
      }
    };

    fetchAdminDetails();
  }, [user, getToken]);

  const menuItems = [
    { id: "stats", label: "Department Stats", icon: BarChart3 },
    { id: "add-hod", label: "Add a Member", icon: UserPlus },
    { id: "reports", label: "View Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="h-full p-4 bg-white rounded-2xl shadow flex flex-col gap-4">
      {/* ✅ Admin Profile Section */}
      {adminInfo ? (
        <div className="text-center border-b pb-4">
          <p className="mt-2 text-blue-600 font-medium">
            👋 Welcome to Admin Page
          </p>
          <img
            src={adminInfo.imageUrl || "/default-avatar.png"}
            alt={adminInfo.name || "Admin"}
            className="w-20 h-20 rounded-full mx-auto object-cover"
          />
          <h2 className="mt-2 text-lg font-semibold">
            {adminInfo.name || "Admin"}
          </h2>
          <p className="text-sm text-gray-500">{adminInfo.phone}</p>
          <p className="text-sm text-gray-500 break-words">{adminInfo.email}</p>
        </div>
      ) : (
        <div className="text-center text-gray-500 border-b pb-4">
          Loading profile...
        </div>
      )}

      {/* ✅ Sidebar Menu */}
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md transition
                ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
