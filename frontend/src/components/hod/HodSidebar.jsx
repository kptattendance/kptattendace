"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  UserPlus,
  Users,
  BookOpen,
  Calendar,
  Settings,
  CheckCircle,
  PieChart,
  Menu as MenuIcon,
  X as XIcon,
  CalendarClock,
} from "lucide-react";

export default function HodSidebar({ selected, setSelected }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [hodInfo, setHodInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchHodDetails = async () => {
      try {
        if (!user?.id) return;
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/getuser/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHodInfo(res.data.data);
      } catch (err) {
        console.error("Error fetching HOD details:", err);
      }
    };
    fetchHodDetails();
  }, [user, getToken]);

  const menu = [
    { id: "mark-attendance", label: "Mark Attendance", Icon: CheckCircle },
    {
      id: "consolidated-attendance",
      label: "Consolidated Attendance",
      Icon: PieChart,
    },
    {
      id: "each-student-attendance",
      label: "Each Student Attendance",
      Icon: Users,
    },
    { id: "add-staff", label: "Add Staff", Icon: UserPlus },
    { id: "add-student", label: "Add Students", Icon: UserPlus },
    { id: "list-student", label: "Students List", Icon: Users },
    { id: "add-subject", label: "Add Subject", Icon: BookOpen },
    { id: "classes-handled", label: "Classes Handled", Icon: CalendarClock }, // New Option

    { id: "timetable", label: "Timetable", Icon: Calendar },
    { id: "settings", label: "Settings", Icon: Settings },
  ];

  return (
    <>
      {/* Hamburger button for mobile */}
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
        className={`
    fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white rounded-r-2xl shadow-md z-50 transform transition-transform
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0 md:static md:rounded-none md:shadow-none
    flex flex-col
  `}
      >
        {/* Close button on mobile */}
        <div className="flex justify-end md:hidden p-2">
          <button onClick={() => setSidebarOpen(false)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* HOD Profile + Menu */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* HOD Profile */}
          <div className="text-center border-b pb-4 flex-shrink-0">
            {hodInfo ? (
              <>
                <p className="mt-2 text-blue-600 font-medium">
                  👋 Welcome to HOD Page
                </p>
                <img
                  src={hodInfo.imageUrl || "/default-avatar.png"}
                  alt={hodInfo.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover"
                />
                <h2 className="mt-2 text-lg font-semibold">{hodInfo.name}</h2>
                <p className="text-sm text-gray-500">{hodInfo.phone}</p>
                <p className="text-sm text-gray-500 break-words">
                  {hodInfo.email}
                </p>
              </>
            ) : (
              <p className="text-gray-500">Loading profile...</p>
            )}
          </div>

          {/* Menu */}
          <nav className="flex-1 mt-4 space-y-1 px-2 pb-4">
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
        </div>
      </aside>
    </>
  );
}
