// api/index.js
import serverless from "serverless-http";
import app from "../src/app.js";
import connectDB from "../src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

// Initialize serverless handler once
const handler = serverless(app);

export default async function (req, res) {
  try {
    // Always await DB connection (safe because connectDB uses caching)
    await connectDB();

    // Process API request through serverless adapter
    return await handler(req, res);

  } catch (error) {
    console.error("Handler error:", error);

    // Ensure proper error response
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Something went wrong on the server",
    });
  }
}
