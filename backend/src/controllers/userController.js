// src/controllers/userController.js
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

// Role hierarchy
const rolePermissions = {
  admin: ["admin", "hod", "staff", "student"],
  hod: ["staff", "student"],
  staff: [],
  student: [],
};

// Utility to check if requester can act on target role
const canManage = (requesterRole, targetRole) => {
  return rolePermissions[requesterRole]?.includes(targetRole);
};

// CREATE user (Clerk + MongoDB)
export const createUser = async (req, res) => {
  try {
    const { role: requesterRoleRaw } = req.user;
    const { name, email, phone, department, role } = req.body;

    const requesterRole = (requesterRoleRaw || "").toLowerCase();
    const targetRole = (role || "").toLowerCase();

    if (
      !targetRole ||
      !["admin", "hod", "staff", "student"].includes(targetRole)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Role is required and must be one of: admin, hod, staff, student.",
      });
    }

    if (!canManage(requesterRole, targetRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create this type of user.",
      });
    }

    // Create Clerk user
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName: name,
      publicMetadata: {
        role: targetRole,
        department: department || null,
      },
    });

    // Mirror into MongoDB
    const user = new User({
      name,
      email,
      phone,
      department,
      role: targetRole,
      clerkId: clerkUser.id,
      imageUrl: req.cloudinaryResult?.secure_url,
      imagePublicId: req.cloudinaryResult?.public_id,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    console.error("CreateUser Error:", err);

    if (err.clerkError && err.errors) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.errors[0]?.message || "Failed to create user.",
        errors: err.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// READ all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ one user by ID (Mongo _id or ClerkId)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    let user;

    if (id.startsWith("user_")) {
      // Clerk ID
      user = await User.findOne({ clerkId: id });
    } else {
      // Mongo ObjectId
      user = await User.findById(id);
    }

    if (!user) {
      // ✅ fallback for admins who exist only in Clerk
      return res.json({
        success: true,
        data: {
          name: "Admin",
          email: req.auth?.claims?.email || "admin@system.com",
          phone: req.auth?.claims?.phone || "N/A",
          imageUrl: "/default-avatar.png", // ✅ safe fallback
          role: "admin",
        },
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE user
// UPDATE user
export const updateUser = async (req, res) => {
  try {
    const { role: clerkRole, id: requesterId } = req.user;
    const { id } = req.params;

    let targetUser;
    if (id.startsWith("user_")) {
      targetUser = await User.findOne({ clerkId: id });
    } else {
      targetUser = await User.findById(id);
    }

    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (targetUser.clerkId !== requesterId) {
      if (!canManage(clerkRole, targetUser.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this user.",
        });
      }
    }

    const updateData = { ...req.body };

    if (
      updateData.role &&
      !["admin", "hod", "staff", "student"].includes(updateData.role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be admin, hod, staff, or student.",
      });
    }

    if (req.cloudinaryResult) {
      updateData.imageUrl = req.cloudinaryResult.secure_url;
      updateData.imagePublicId = req.cloudinaryResult.public_id;
    }

    // 🔥 Update Clerk metadata too
    await clerkClient.users.updateUser(targetUser.clerkId, {
      publicMetadata: {
        role: updateData.role || targetUser.role,
        department: updateData.department || targetUser.department,
      },
    });

    // Update Mongo
    const user = await User.findByIdAndUpdate(targetUser._id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("UpdateUser Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE user
export const deleteUser = async (req, res) => {
  try {
    const { role: clerkRole, id: requesterId } = req.user;
    const { id } = req.params;

    let user;
    if (id.startsWith("user_")) {
      user = await User.findOne({ clerkId: id });
    } else {
      user = await User.findById(id);
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.clerkId === requesterId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    if (!canManage(clerkRole, user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this user.",
      });
    }

    // 1. Delete Cloudinary image first (optional)
    if (user.imagePublicId) {
      try {
        const result = await cloudinary.uploader.destroy(user.imagePublicId);
        console.log("Cloudinary deletion result:", result);
      } catch (err) {
        console.error("Cloudinary deletion error:", err);
      }
    }

    // 2. Delete Clerk user
    try {
      await clerkClient.users.deleteUser(user.clerkId);
    } catch (err) {
      console.error("Clerk deletion error:", err);
    }

    // 3. Delete MongoDB record
    await user.deleteOne();

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SYNC user (Clerk → MongoDB if missing)
export const syncUser = async (req, res) => {
  try {
    const clerkId = req.user.id;

    let user = await User.findOne({ clerkId });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      user = new User({
        name: clerkUser.firstName || "Unknown",
        email:
          clerkUser.emailAddresses[0]?.emailAddress || "unknown@example.com",
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || "N/A",
        role: clerkUser.publicMetadata?.role || "student", // fallback
        department: clerkUser.publicMetadata?.department || null,
        clerkId: clerkUser.id,
        imageUrl: clerkUser.profileImageUrl || "/default-avatar.png",
      });

      await user.save();
      console.log(`✅ Synced new user: ${user.email}`);
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("SyncUser Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
