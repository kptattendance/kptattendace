"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  CheckCircle,
  Users,
  BookOpen,
  Settings,
  Menu as MenuIcon,
  X as XIcon,
} from "lucide-react";

export default function StaffSidebar({ selected, setSelected }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [staffInfo, setStaffInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        if (!user?.id) return;
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/getuser/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStaffInfo(res.data.data);
      } catch (err) {
        console.error("Error fetching staff details:", err);
      }
    };
    fetchStaffDetails();
  }, [user, getToken]);

  const menu = [
    { id: "mark-attendance", label: "Mark Attendance", Icon: CheckCircle },
    { id: "sub-attendance", label: "Subject Attendance", Icon: BookOpen },
    // { id: "subjects", label: "Subjects", Icon: BookOpen },
    // { id: "settings", label: "Settings", Icon: Settings },
  ];

  return (
    <>
      {/* Hamburger button (mobile) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow"
        onClick={() => setSidebarOpen(true)}
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white rounded-r-2xl shadow-md z-50 transform transition-transform
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:rounded-none md:shadow-none flex flex-col`}
      >
        {/* Close button on mobile */}
        <div className="flex justify-end md:hidden p-2">
          <button onClick={() => setSidebarOpen(false)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Staff Profile */}
        <div className="text-center border-b pb-4 flex-shrink-0">
          {staffInfo ? (
            <>
              <p className="mt-2 text-blue-600 font-medium">
                👋 Welcome {staffInfo.role || "Staff"}
              </p>
              <img
                src={staffInfo.imageUrl || "/default-avatar.png"}
                alt={staffInfo.name}
                className="w-20 h-20 rounded-full mx-auto object-cover"
              />
              <h2 className="mt-2 text-lg font-semibold">{staffInfo.name}</h2>
              <p className="text-sm text-gray-500">{staffInfo.phone}</p>
              <p className="text-sm text-gray-500 break-words">
                {staffInfo.email}
              </p>
            </>
          ) : (
            <p className="text-gray-500">Loading profile...</p>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 mt-4 overflow-y-auto space-y-1 px-2 pb-4">
          {menu.map((m) => {
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelected(m.id);
                  setSidebarOpen(false); // auto-close on mobile
                }}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md transition
                  ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <m.Icon className="w-5 h-5" />
                <span className="font-small">{m.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
