// src/middlewares/authMiddleware.js
import { getAuth, clerkClient } from "@clerk/express";

export const authenticateUser = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. No userId found." });
    }

    // Fetch user from Clerk
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized. User not found." });
    }

    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: user.publicMetadata?.role || null,
      department: user.publicMetadata?.department || null, // 🔑 added
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ error: "Unauthorized request" });
  }
};
