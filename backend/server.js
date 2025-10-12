// server.js
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import "express-async-errors";
import {
  clerkMiddleware,
  requireAuth,
  getAuth,
  clerkClient,
} from "@clerk/express";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import attendanceSessionRoutes from "./src/routes/attendanceSessionRoutes.js";
import attendanceRecordRoutes from "./src/routes/attendanceRecordRoutes.js";
import attendanceReportRoutes from "./src/routes/attendanceReportRoutes.js";
import statisticsRoutes from "./src/routes/statisticsRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// core middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000", // local dev frontend
      "https://kptattendance.vercel.app", // your actual Vercel frontend URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // allows cookies/tokens to flow
  })
);
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// logger
app.use(morgan("dev"));

// clerk middleware
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("🚀 API server is running");
});

// example protected route
app.get("/protected", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const user = await clerkClient.users.getUser(userId);
  res.json({ message: "protected data", user });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance/sessions", attendanceSessionRoutes);
app.use("/api/attendance/records", attendanceRecordRoutes);
app.use("/api/attendance/reports", attendanceReportRoutes);
app.use("/api/statistics", statisticsRoutes);
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
