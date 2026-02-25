import bcrypt from "bcryptjs";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import cloudinary from "../utils/cloudinary.js";

/* ===============================
   👤 UPDATE PROFILE
   Upload avatar ONLY when updating
================================ */
export const updateProfile = async (req, res) => {
  try {
    const admin = req.admin;

    if (!admin)
      return res.status(401).json({ message: "Admin not authorized" });

    // Update text fields
    admin.name = req.body.name?.trim() || admin.name;
    admin.email = req.body.email?.trim() || admin.email;

    /* ===============================
       🖼️ HANDLE IMAGE UPDATE
       Only runs if file exists
    =============================== */
    if (req.file) {
      try {
        // Upload new image to Cloudinary
        const uploaded = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );

        // Delete old image if exists
        if (admin.avatar?.public_id) {
          await cloudinary.uploader.destroy(admin.avatar.public_id);
        }

        // Save new avatar
        admin.avatar = {
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError.message);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    await admin.save();

    res.json({
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar?.url || null,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/* ===============================
   🔑 CHANGE PASSWORD
================================ */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = req.admin;

    if (!admin)
      return res.status(401).json({ message: "Admin not authorized" });

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (!admin.password)
      return res.status(500).json({ message: "Password data missing" });

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Current password incorrect" });

    // Prevent using same password again
    const isSame = await bcrypt.compare(newPassword, admin.password);
    if (isSame)
      return res.status(400).json({ message: "New password must be different" });

    // Hash new password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err.message);
    res.status(500).json({ message: "Failed to change password" });
  }
};