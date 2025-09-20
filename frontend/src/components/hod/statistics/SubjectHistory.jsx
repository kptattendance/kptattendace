"use client";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import LoaderOverlay from "../../LoaderOverlay"; // 👈 import

export default function SubjectHistory({ studentId, subjectId }) {
  const { getToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/student-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { studentId, subjectId },
        }
      );
      setHistory(res.data.history || []);
      setOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={fetchHistory}
        className="text-blue-600 underline text-sm"
      >
        View Details
      </button>

      {/* Loader overlay */}
      {loading && <LoaderOverlay message="Fetching attendance history..." />}

      {open && !loading && (
        <table className="w-full mt-2 border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">Time</th>
              <th className="px-2 py-1 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center p-2 text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              history.map((h, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 border">
                    {new Date(h.date).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-1 border">{h.timeSlot}</td>
                  <td
                    className={`px-2 py-1 border ${
                      h.status === "Absent" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {h.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
