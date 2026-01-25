import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import { createClient } from "redis";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.log("Redis url not found");
  process.exit(1);
}

export const redisClient = createClient({
  url: REDIS_URL,
});

const startServer = async () => {
  try {
    //express
    const app = express();

    //database
    await connectDb();

    //redis
    await redisClient.connect();
    console.log("Redis connected successfully");

    //middleware
    app.use(express.json());

    //routes
    app.use("/api/user", userRoutes);

    app.listen(PORT, () => {
      console.log(`Server started on Port ${PORT}`);
    });
  } catch (error) {
    console.log("Error in starting the server", error);
    process.exit(1);
  }
};

startServer();
