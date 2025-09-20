"use client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoaderOverlay({ message = "Loading..." }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex flex-col items-center gap-4 rounded-2xl bg-white/80 dark:bg-gray-300/80 px-8 py-6 shadow-xl border border-gray-200/40 dark:border-gray-700/40"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-blue-600" />
        </motion.div>

        {/* Message */}
        <p className="text-gray-800 dark:text-gray-200 text-base font-medium tracking-wide text-center">
          {message}
        </p>
      </motion.div>
    </motion.div>
  );
}
