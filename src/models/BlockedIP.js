import mongoose from "mongoose";

const blockedIPSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    default: "Manual block"
  },
  expiresAt: {
    type: Date,
    default: null // null means permanent
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
blockedIPSchema.index({ ipAddress: 1 });
blockedIPSchema.index({ expiresAt: 1 });

export default mongoose.model("BlockedIP", blockedIPSchema);