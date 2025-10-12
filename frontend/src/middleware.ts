// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();





export const config = {
  matcher: [
    // Protect all app routes but exclude static assets and API
    "/((?!_next|api|favicon.ico|.*\\..*).*)",
  ],
};
