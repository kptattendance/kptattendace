import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export const metadata = { title: "KPT Attendance Portal" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Load Inter font properly */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          {children}
        </ClerkProvider>

        {/* 👇 Place Toaster at the very end */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
