"use client";

import Link from "next/link";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 bg-white shadow-md z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-700">
            KPT Attendance
          </Link>

          {/* Right side (auth buttons) */}
          <div>
            <SignedOut>
              <SignInButton>
                <button className="px-5 py-2 bg-blue-600 text-white font-medium rounded-full shadow hover:bg-blue-700 transition">
                  Login
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-gray-200 font-medium rounded-full shadow hover:bg-gray-300 transition"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Welcome to KPT Attendance Portal
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          Students and staff can check their attendance status here.
        </p>

        {/* Stats cards with gradient backgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
            <h2 className="text-lg font-medium">Students Present</h2>
            <p className="text-4xl font-extrabold mt-3">120</p>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
            <h2 className="text-lg font-medium">Classes Held</h2>
            <p className="text-4xl font-extrabold mt-3">18</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
            <h2 className="text-lg font-medium">Attendance %</h2>
            <p className="text-4xl font-extrabold mt-3">87%</p>
          </div>
        </div>

        {/* Primary action */}
        <div className="flex justify-center">
          <button className="px-8 py-3 bg-blue-600 text-white font-semibold text-lg rounded-full shadow-lg hover:bg-blue-700 transition">
            Take Attendance
          </button>
        </div>

        {/* Extra stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
          <div className="bg-white p-6 rounded-2xl shadow text-center hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-700">
              Students Present Today
            </h2>
            <p className="text-3xl font-bold mt-3 text-blue-700">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow text-center hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-700">
              Classes Held
            </h2>
            <p className="text-3xl font-bold mt-3 text-green-600">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow text-center hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-700">
              Attendance %
            </h2>
            <p className="text-3xl font-bold mt-3 text-yellow-600">0%</p>
          </div>
        </div>
      </main>
    </div>
  );
}
