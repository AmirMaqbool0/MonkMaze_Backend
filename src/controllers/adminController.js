import Admin from "../models/Admin.js";
import LoginLog from "../models/LoginLog.js";
import BlockedIP from "../models/BlockedIP.js"; // You'll need to create this model

// 📋 Get all admins (with avatar)
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password -resetPasswordToken -resetPasswordExpire");
    
    // Format the response to include avatar URL properly
    const formattedAdmins = admins.map(admin => ({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isBlocked: admin.isBlocked,
      avatar: admin.avatar?.url || null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    }));
    
    res.json(formattedAdmins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Failed to fetch admins" });
  }
};

// 🚫 Block admin
export const blockAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id, 
      { isBlocked: true },
      { new: true }
    ).select("-password");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Return the updated admin with avatar
    res.json({ 
      message: "Admin blocked successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isBlocked: admin.isBlocked,
        avatar: admin.avatar?.url || null
      }
    });
  } catch (error) {
    console.error("Error blocking admin:", error);
    res.status(500).json({ message: "Failed to block admin" });
  }
};

// 📜 Login history (with admin details including avatar)
export const getLoginLogs = async (req, res) => {
  try {
    const logs = await LoginLog.find()
      .populate({
        path: "adminId",
        select: "name email avatar role isBlocked",
        model: Admin
      })
      .sort({ loginTime: -1 });

    // Format the logs to include avatar URL properly
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      adminId: log.adminId ? {
        _id: log.adminId._id,
        name: log.adminId.name,
        email: log.adminId.email,
        role: log.adminId.role,
        isBlocked: log.adminId.isBlocked,
        avatar: log.adminId.avatar?.url || null
      } : null,
      email: log.email,
      ipAddress: log.ipAddress,
      location: log.location,
      loginTime: log.loginTime,
      userAgent: log.userAgent,
      device: log.device,
      browser: log.browser,
      os: log.os,
      isCurrent: log.isCurrent || false,
      signedOut: log.signedOut || false,
      blocked: log.blocked || false,
      createdAt: log.createdAt
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error("Error fetching login logs:", error);
    res.status(500).json({ message: "Failed to fetch login logs" });
  }
};

// 🔐 Get current user's sessions
export const getMySessions = async (req, res) => {
  try {
    const sessions = await LoginLog.find({ 
      adminId: req.user._id 
    })
    .sort({ loginTime: -1 })
    .limit(50); // Get last 50 sessions
    
    // Format sessions
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      device: session.device || "Unknown Device",
      browser: session.browser || "Unknown Browser",
      os: session.os || "Unknown OS",
      ipAddress: session.ipAddress,
      location: session.location || "Unknown",
      lastActive: session.loginTime,
      isCurrent: session._id.toString() === (req.query.currentSessionId || ""),
      status: session.blocked ? "blocked" : (session.signedOut ? "signedOut" : "active"),
      userAgent: session.userAgent
    }));
    
    res.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

// 🚪 Sign out specific session
export const signOutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify the session belongs to the current user
    const session = await LoginLog.findOne({
      _id: sessionId,
      adminId: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Mark as signed out
    session.signedOut = true;
    session.signedOutAt = new Date();
    await session.save();
    
    // Here you would also invalidate the JWT token for this session
    // This depends on your token management strategy
    
    res.json({ 
      message: "Session signed out successfully",
      sessionId 
    });
  } catch (error) {
    console.error("Error signing out session:", error);
    res.status(500).json({ message: "Failed to sign out session" });
  }
};

// 🚪 Sign out all other sessions
export const signOutAllOtherSessions = async (req, res) => {
  try {
    const { currentSessionId } = req.body;
    
    if (!currentSessionId) {
      return res.status(400).json({ message: "Current session ID is required" });
    }
    
    // Mark all other sessions as signed out
    await LoginLog.updateMany(
      { 
        adminId: req.user._id,
        _id: { $ne: currentSessionId },
        signedOut: { $ne: true },
        blocked: { $ne: true }
      },
      {
        $set: {
          signedOut: true,
          signedOutAt: new Date()
        }
      }
    );
    
    res.json({ 
      message: "All other sessions signed out successfully",
      count: result.modifiedCount 
    });
  } catch (error) {
    console.error("Error signing out all sessions:", error);
    res.status(500).json({ message: "Failed to sign out all sessions" });
  }
};

// 🚫 Block IP address
export const blockIPAddress = async (req, res) => {
  try {
    const { ipAddress, sessionId } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({ message: "IP address is required" });
    }
    
    // Check if IP is already blocked
    const existingBlock = await BlockedIP.findOne({ ipAddress });
    
    if (!existingBlock) {
      // Add to blocked IPs collection
      await BlockedIP.create({
        ipAddress,
        blockedBy: req.user._id,
        blockedAt: new Date(),
        reason: req.body.reason || "Manual block from session management"
      });
    }
    
    // Mark all sessions with this IP as blocked
    await LoginLog.updateMany(
      { 
        ipAddress,
        _id: sessionId ? { $ne: sessionId } : {} // Exclude current session if specified
      },
      {
        $set: {
          blocked: true,
          blockedAt: new Date(),
          blockedBy: req.user._id
        }
      }
    );
    
    // If this is blocking a specific session, also sign it out
    if (sessionId) {
      await LoginLog.findByIdAndUpdate(sessionId, {
        signedOut: true,
        signedOutAt: new Date()
      });
    }
    
    res.json({ 
      message: "IP address blocked successfully",
      ipAddress 
    });
  } catch (error) {
    console.error("Error blocking IP:", error);
    res.status(500).json({ message: "Failed to block IP address" });
  }
};

// 📊 Get session statistics
export const getSessionStats = async (req, res) => {
  try {
    const totalSessions = await LoginLog.countDocuments({ adminId: req.user._id });
    const activeSessions = await LoginLog.countDocuments({ 
      adminId: req.user._id,
      signedOut: { $ne: true },
      blocked: { $ne: true }
    });
    const blockedSessions = await LoginLog.countDocuments({ 
      adminId: req.user._id,
      blocked: true 
    });
    
    // Get unique devices
    const devices = await LoginLog.aggregate([
      { $match: { adminId: req.user._id } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent locations
    const locations = await LoginLog.find({ adminId: req.user._id })
      .sort({ loginTime: -1 })
      .limit(10)
      .select("location loginTime");
    
    res.json({
      total: totalSessions,
      active: activeSessions,
      blocked: blockedSessions,
      devices,
      recentLocations: locations
    });
  } catch (error) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ message: "Failed to fetch session statistics" });
  }
};

// 🗑️ Clear old sessions (admin only)
export const clearOldSessions = async (req, res) => {
  try {
    const { days = 30 } = req.query; // Default to 30 days
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Delete old signed out/blocked sessions
    const result = await LoginLog.deleteMany({
      adminId: req.user._id,
      $or: [
        { signedOut: true },
        { blocked: true }
      ],
      loginTime: { $lt: cutoffDate }
    });
    
    res.json({
      message: `Cleared ${result.deletedCount} old sessions`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error clearing old sessions:", error);
    res.status(500).json({ message: "Failed to clear old sessions" });
  }
};

// 🔍 Get session details by ID
export const getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await LoginLog.findOne({
      _id: sessionId,
      adminId: req.user._id
    }).populate("adminId", "name email avatar");
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    res.json({
      _id: session._id,
      device: session.device,
      browser: session.browser,
      os: session.os,
      ipAddress: session.ipAddress,
      location: session.location,
      loginTime: session.loginTime,
      logoutTime: session.signedOutAt,
      status: session.blocked ? "blocked" : (session.signedOut ? "signedOut" : "active"),
      userAgent: session.userAgent,
      admin: session.adminId ? {
        name: session.adminId.name,
        email: session.adminId.email,
        avatar: session.adminId.avatar?.url || null
      } : null
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ message: "Failed to fetch session" });
  }
};

// Optional: Get single admin by ID
export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password -resetPasswordToken -resetPasswordExpire");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isBlocked: admin.isBlocked,
      avatar: admin.avatar?.url || null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    });
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ message: "Failed to fetch admin" });
  }
};

// Optional: Unblock admin
export const unblockAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id, 
      { isBlocked: false },
      { new: true }
    ).select("-password");
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ 
      message: "Admin unblocked successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isBlocked: admin.isBlocked,
        avatar: admin.avatar?.url || null
      }
    });
  } catch (error) {
    console.error("Error unblocking admin:", error);
    res.status(500).json({ message: "Failed to unblock admin" });
  }
};

// Optional: Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Also delete associated login logs
    await LoginLog.deleteMany({ adminId: req.params.id });

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Failed to delete admin" });
  }
};

// 📝 Helper function to parse user agent (can be used in login middleware)
export const parseUserAgent = (userAgent) => {
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";
  
  if (!userAgent) return { browser, os, device };
  
  // Detect browser
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
    browser = "Internet Explorer";
  }
  
  // Detect OS
  if (userAgent.includes("Windows NT 10.0")) {
    os = "Windows 10/11";
  } else if (userAgent.includes("Windows NT 6.1")) {
    os = "Windows 7";
  } else if (userAgent.includes("Mac OS X")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
    device = "Mobile";
  } else if (userAgent.includes("iPhone")) {
    os = "iOS";
    device = "Mobile";
  } else if (userAgent.includes("iPad")) {
    os = "iOS";
    device = "Tablet";
  }
  
  // Extract version
  if (browser === "Chrome") {
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) browser += ` ${match[1]}`;
  } else if (browser === "Firefox") {
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) browser += ` ${match[1]}`;
  }
  
  return { browser, os, device };
};