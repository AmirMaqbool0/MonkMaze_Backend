import mongoose from "mongoose";

const loginLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  email: String,
  ipAddress: String,
  location: String,
  loginTime: { type: Date, default: Date.now },
  
  // New fields for session management
  userAgent: String,
  browser: String,
  os: String,
  device: String,
  isCurrent: { type: Boolean, default: false },
  signedOut: { type: Boolean, default: false },
  signedOutAt: Date,
  blocked: { type: Boolean, default: false },
  blockedAt: Date,
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
}, {
  timestamps: true
});

// Index for faster queries
loginLogSchema.index({ adminId: 1, loginTime: -1 });
loginLogSchema.index({ ipAddress: 1 });
loginLogSchema.index({ signedOut: 1, blocked: 1 });

export default mongoose.model("LoginLog", loginLogSchema);