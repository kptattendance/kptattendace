// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Protect everything except public & attendance take route
    "/((?!_next|api|favicon.ico|.*\\..*|attendance/take/.*).*)",
  ],
};
