"use client";

export default function UnauthorizedPage() {
  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/clgimg1.jpg')" }} // 👈 put your image in /public
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content Card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-10 max-w-lg text-center border border-gray-200">
        <h1 className="text-3xl font-extrabold text-red-600 mb-4 drop-shadow-md">
          🚫 Access Denied
        </h1>
        <p className="text-gray-800 mb-6 leading-relaxed text-lg">
          You are{" "}
          <strong className="text-blue-700">
            not a member of KPT Mangalore
          </strong>{" "}
          and are not authorized to access this portal.
        </p>

        <a
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-blue-800 transition-transform transform hover:scale-105"
        >
          ⬅ Back to Home
        </a>
      </div>
    </div>
  );
}
