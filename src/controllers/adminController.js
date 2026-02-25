import Admin from "../models/Admin.js";
import LoginLog from "../models/LoginLog.js";

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
      createdAt: log.createdAt
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error("Error fetching login logs:", error);
    res.status(500).json({ message: "Failed to fetch login logs" });
  }
};

// Optional: Get single admin by ID (if needed)
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