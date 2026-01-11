import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import cookieParser from "cookie-parser";

// routes
import userRoutes from "./routes/user.js";

dotenv.config();

const { PORT = 5000, REDIS_URL } = process.env;

if (!REDIS_URL) {
  console.error(" REDIS_URL is not defined");
  process.exit(1);
}

export const redisClient = createClient({
  url: REDIS_URL,
});

const startServer = async () => {
  try {
    await connectDb();
    console.log("MongoDB connected");

    await redisClient.connect();
    console.log("Redis connected");

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(cookieParser());

    // Routes
    app.use("/api/v1", userRoutes);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
