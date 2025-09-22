"use client";
import axios from "axios";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // 👈 get Clerk JWT
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/unauthorized");
      return;
    }

    // Wrap async logic in a function
    const syncUser = async () => {
      try {
        const token = await getToken();
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/syncuser`,
          {}, // no body needed
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Synced user:", res.data);
      } catch (err) {
        console.error("❌ Sync error:", err.response?.data || err.message);
      }
    };

    syncUser();

    // Role check
    const role = user.publicMetadata?.role?.toLowerCase();

    if (!role) {
      toast.error("❌ You are not permitted to access this page.");
      router.replace("/unauthorized");
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
          duration: 4000,
        });
        router.replace("/unauthorized");
    }
  }, [isLoaded, user, router, getToken]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Loading dashboard...</h1>
    </div>
  );
}
