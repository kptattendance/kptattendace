"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/unauthorized");
      return;
    }

    const role = user.publicMetadata?.role?.toLowerCase();

    if (!role) {
      toast.error("❌ You are not permitted to access this page.");
      router.replace("/unauthorized"); // optional redirect to home
      return;
    }

    switch (role) {
      case "admin":
        router.replace("/admin");
        break;
      case "hod":
        router.replace("/hod");
        break;
      case "staff":
        router.replace("/staff");
        break;
      case "student":
        router.replace("/student");
        break;
      case "principal":
        router.replace("/principal");
        break;
      default:
        toast.error("❌ You are not permitted to access this page.", {
          duration: 4000, // 👈 4 seconds
        });

        router.replace("/unauthorized");
    }
  }, [isLoaded, user, router]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Loading dashboard...</h1>
    </div>
  );
}
