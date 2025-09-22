"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import LoaderOverlay from "../../LoaderOverlay";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";

export default function BulkUpload() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState(null);
  const [students, setStudents] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingFile(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(sheet);

        // Validate required fields
        const missing = parsed.filter(
          (s) =>
            !s.registerNumber ||
            !s.name ||
            !s.email ||
            !s.phone ||
            !s.department ||
            !s.semester ||
            !s.batch
        );
        if (missing.length) {
          toast.error("❌ Some rows are missing required fields");
          setLoadingFile(false);
          return;
        }

        setStudents(parsed);
        toast.success(`✅ Loaded ${parsed.length} students from file`);
      } catch (err) {
        toast.error("❌ Failed to read Excel file");
      } finally {
        setLoadingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!students.length) {
      toast.error("❌ No students loaded!");
      return;
    }

    setStatus("saving");
    try {
      const token = await getToken();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/students/bulk-add`,
        { students },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("All students added successfully!");
      } else {
        res.data.results.forEach((r) => {
          if (!r.success) {
            toast.error(`Student ${r.registerNumber}: ${r.message}`);
          }
        });
        toast.success("Bulk add completed with some errors");
      }

      setStudents([]);
      setFileName("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "❌ Bulk upload failed");
    } finally {
      setStatus(null);
    }
  };

  return (
    <section className="p-6 bg-white rounded-2xl shadow-lg">
      {(status === "saving" || loadingFile) && (
        <LoaderOverlay
          message={
            status === "saving"
              ? "Uploading students..."
              : "Reading Excel file..."
          }
        />
      )}

      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Bulk Student Upload
      </h2>

      {/* Upload Area */}
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition"
      >
        {loadingFile ? (
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        ) : (
          <Upload className="w-10 h-10 text-blue-600 mb-2" />
        )}
        <span className="text-gray-700 font-medium">
          {fileName ? "Change Excel File" : "Click or Drag & Drop Excel File"}
        </span>
        <span className="text-sm text-gray-500 mt-1">
          Supports .xlsx and .xls
        </span>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {/* File Info */}
      {fileName && (
        <div className="flex items-center mt-4 text-gray-700">
          <FileSpreadsheet className="w-6 h-6 text-green-600 mr-2" />
          <span>{fileName}</span>
        </div>
      )}

      {/* Students Preview */}
      {students.length > 0 && (
        <p className="text-green-600 font-medium mt-4">
          ✅ {students.length} students ready to upload
        </p>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!students.length || status === "saving"}
      >
        {status === "saving" ? (
          <span className="flex items-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Uploading...
          </span>
        ) : (
          "Upload Students"
        )}
      </button>
    </section>
  );
}
