import bcrypt from "bcryptjs";
import crypto from "crypto";
import Admin from "../models/Admin.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import cloudinary from "../utils/cloudinary.js";
import { sendEmail } from "../utils/sendEmail.js";

/* ===============================
   👤 UPDATE PROFILE
   Upload avatar ONLY when updating
   (EMAIL CHANGE REMOVED FOR SECURITY)
================================ */
export const updateProfile = async (req, res) => {
  try {
    const admin = req.admin;

    if (!admin)
      return res.status(401).json({ message: "Admin not authorized" });

    // Update ONLY name (email removed intentionally)
    admin.name = req.body.name?.trim() || admin.name;

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

/* ===============================
   📧 REQUEST EMAIL CHANGE (SEND OTP)
================================ */
export const requestEmailChange = async (req, res) => {
  try {
    const admin = req.admin;
    const { oldEmail, newEmail, confirmEmail } = req.body;

    if (!admin)
      return res.status(401).json({ message: "Admin not authorized" });

    // verify old email
    if (admin.email !== oldEmail)
      return res.status(400).json({ message: "Current email incorrect" });

    // confirm match
    if (newEmail !== confirmEmail)
      return res.status(400).json({ message: "Emails do not match" });

    // check already used
    const exists = await Admin.findOne({ email: newEmail });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

    // generate otp
    const otp = crypto.randomInt(100000, 999999).toString();

    // save temp change
    admin.emailChange = {
      newEmail,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000,
    };

    await admin.save();

    // send otp to old email
    await sendEmail({
      to: admin.email,
      subject: "Verify your email change",
      html: `
        <h2>Email Change Request</h2>
        <p>You requested to change your admin email.</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    });

    res.json({ message: "OTP sent to your current email" });

  } catch (error) {
    console.error("Email change request error:", error.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

/* ===============================
   ✅ VERIFY OTP & CHANGE EMAIL
================================ */
export const verifyEmailChange = async (req, res) => {
  try {
    const admin = req.admin;
    const { otp } = req.body;

    if (!admin)
      return res.status(401).json({ message: "Admin not authorized" });

    if (!admin.emailChange?.otp)
      return res.status(400).json({ message: "No email change request found" });

    // check otp match
    if (admin.emailChange.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    // check expiry
    if (admin.emailChange.otpExpire < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    // update email
    admin.email = admin.emailChange.newEmail;

    // clear temporary data
    admin.emailChange = undefined;

    await admin.save();

    res.json({
      message: "Email changed successfully",
      email: admin.email,
    });

  } catch (error) {
    console.error("Verify email error:", error.message);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};