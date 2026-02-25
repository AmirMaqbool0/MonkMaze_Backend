import express from "express";
import { updateProfile, changePassword } from "../controllers/adminProfileController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js"; // 👈 add this

const router = express.Router();

/*
  Update profile
  - accepts optional avatar image
  - if no file → only text updates
*/
router.put(
  "/update-profile",
  protect,
  upload.single("avatar"), // 👈 IMPORTANT (must match frontend key)
  updateProfile
);

// Change password (no file needed)
router.put("/change-password", protect, changePassword);

export default router;