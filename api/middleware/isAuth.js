import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
import { User } from "../models/user.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(403).json({
        message: "Please login-no token",
      });
    }

    const decodedData = jwt.verify(token, process.env);

    if (!decodedData) {
      return res.status(400).json({
        message: "Token expired",
      });
    }

    //check if user in redis and use it

    const cacheUser = await redisClient.get(`user:${decodedData.id}`);
    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }

    //if user not in redis

    const user = await User.findById(decodedData.id).select("-password");

    if (!user) {
      return res.status(400).json({
        message: "No user with this id",
      });
    }

    await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
