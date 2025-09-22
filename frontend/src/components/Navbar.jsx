"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

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

        {/* Right side (auth buttons / avatar) */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                Login
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {/* User avatar with dropdown menu */}
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10", // size of avatar
                },
              }}
              afterSignOutUrl="/" // redirect after logout
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
