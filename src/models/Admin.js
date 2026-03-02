import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "admin",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    avatar: {
      url: {
        type: String,
        default: null,
      },
      public_id: {
        type: String,
        default: null,
      },
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ⭐ NEW — EMAIL CHANGE VERIFICATION
    emailChange: {
      newEmail: {
        type: String,
        default: null,
      },
      otp: {
        type: String,
        default: null,
      },
      otpExpire: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);