import { isSessionActive } from "../config/tokenGeneration.js";
import { redisClient } from "../index.js";
import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(403).json({
        message: "Please login-no token",
      });
    }

    const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN);

    const sessionActive = await isSessionActive(
      decodedData.id,
      decodedData.sessionId,
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    if (!sessionActive) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      res.clearCookie("csrfToken", cookieOptions);

      return res.status(401).json({
        message: "Session Expired,you have been logged in from another device",
      });
    }

    const cacheUser = await redisClient.get(`user:${decodedData.id}`);

    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      req.sessionId = decodedData.sessionId;
      return next();
    }

    const user = await User.findById(decodedData.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        message: "No user with this id",
      });
    }

    await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));

    req.user = user;
    req.sessionId = decodedData.sessionId;
    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

export const authorizedAdmin = async (req, res, next) => {
  const user = req.user;

  if (user.role !== "admin") {
    return res.status(401).json({
      message: "Access denied",
    });
  }

  next();
};
