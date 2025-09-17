import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { uploadSingleImage } from "../middlewares/uploadImage.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Clerk-protected routes
router.post("/adduser", authenticateUser, uploadSingleImage, createUser);
router.get("/getusers", authenticateUser, getUsers);
router.get("/getuser/:id", authenticateUser, getUserById);
router.put("/updateuser/:id", authenticateUser, uploadSingleImage, updateUser);
router.delete("/deleteuser/:id", authenticateUser, deleteUser);

export default router;
