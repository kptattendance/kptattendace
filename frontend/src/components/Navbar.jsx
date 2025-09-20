"use client";

import Link from "next/link";
import {
  SignOutButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { LogIn, LogOut } from "lucide-react"; // modern icons

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo + App Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">
            KPT Attendance
          </span>
        </Link>

        {/* Right side (auth buttons) */}
        <div>
          <SignedOut>
            <SignInButton>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                <LogIn size={18} />
                <span>Login</span>
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <SignOutButton>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
