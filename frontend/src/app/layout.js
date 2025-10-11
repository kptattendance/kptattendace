import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export const metadata = {
  title: "KPT Attendance Portal | KPT Mangalore",
  description:
    "KPT Attendance Portal simplifies attendance tracking for students and staff at KPT Mangalore. Secure, fast, and reliable attendance management.",
  keywords: [
    "KPT Attendance Portal",
    "KPT Mangalore",
    "Attendance System",
    "College Attendance",
    "Student Attendance",
    "Teacher Portal",
    "KPT College Management",
    "Mangalore Polytechnic",
  ],
  authors: [{ name: "KPT Mangalore" }],
  creator: "KPT Mangalore",
  publisher: "KPT Mangalore",
  metadataBase: new URL("https://kptattendance.vercel.app"),
  alternates: {
    canonical: "https://kptattendance.vercel.app",
  },
  openGraph: {
    title: "KPT Attendance Portal | KPT Mangalore",
    description:
      "Easily manage attendance for students and staff with the KPT Attendance Portal.",
    url: "https://kptattendance.vercel.app",
    siteName: "KPT Attendance Portal",
    images: [
      {
        url: "https://kptattendance.vercel.app/clgimg1.jpg",
        width: 1200,
        height: 630,
        alt: "KPT Attendance Portal",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KPT Attendance Portal | KPT Mangalore",
    description:
      "Simplifying attendance management for KPT students and faculty.",
    images: ["https://kptattendance.vercel.app/images/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Search Console verification */}
        <meta
          name="google-site-verification"
          content="FHsNWVXWWRw0Ce3yPMaQAwFy_0M6R_X_s4t8tn6rY_Q"
        />

        {/* ✅ Font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ✅ Optional structured data (SEO boost) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "KPT Attendance Portal",
              url: "https://kptattendance.vercel.app",
              logo: "https://kptattendance.vercel.app/images/logo.png",
              description:
                "Digital attendance tracking platform for KPT Mangalore students and staff.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "KPT Campus, Kadri Hills",
                addressLocality: "Mangalore",
                addressRegion: "Karnataka",
                postalCode: "575003",
                addressCountry: "IN",
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Support",
                email: "support@kptattendance.edu.in",
                availableLanguage: ["English", "Kannada"],
              },
            }),
          }}
        />
      </head>

      <body>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          {children}
        </ClerkProvider>

        {/* Global toast notifications */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
