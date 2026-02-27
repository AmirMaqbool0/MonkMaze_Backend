import express from "express";
import {
  // Existing functions
  getAllAdmins,
  blockAdmin,
  getLoginLogs,
  getAdminById,
  unblockAdmin,
  deleteAdmin,
  
  // New session management functions
  getMySessions,
  signOutSession,
  signOutAllOtherSessions,
  blockIPAddress,
  getSessionStats,
  clearOldSessions,
  getSessionById
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ============ ADMIN MANAGEMENT ROUTES ============
// Get all admins
router.get("/admins", protect, getAllAdmins);

// Get single admin by ID
router.get("/admins/:id", protect, getAdminById);

// Block/unblock admin
router.put("/block/:id", protect, blockAdmin);
router.put("/unblock/:id", protect, unblockAdmin);

// Delete admin
router.delete("/admins/:id", protect, deleteAdmin);

// ============ LOGIN LOGS ROUTES ============
// Get all login logs (admin only - super admin maybe)
router.get("/login-logs", protect, getLoginLogs);

// ============ SESSION MANAGEMENT ROUTES ============
// Get current user's sessions
router.get("/my-sessions", protect, getMySessions);

// Get session statistics
router.get("/session-stats", protect, getSessionStats);

// Get specific session details
router.get("/sessions/:sessionId", protect, getSessionById);

// Sign out specific session
router.post("/signout/:sessionId", protect, signOutSession);

// Sign out all other sessions
router.post("/signout-all", protect, signOutAllOtherSessions);

// Block IP address
router.post("/block-ip", protect, blockIPAddress);

// Clear old sessions
router.delete("/clear-old-sessions", protect, clearOldSessions);

export default router;