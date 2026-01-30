import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";

export const generateToken = async (id, res) => {
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN, {
    expiresIn: "7d",
  });

  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN, {
    expiresIn: "3m", // Fixed: "3m" not "3min"
  });

  const refreshTokenKey = `refreshTokenKey:${id}`;

  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

  // Use environment variable to determine secure setting
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction, // true in production, false in dev
    sameSite: isProduction ? "none" : "lax", // "none" for cross-origin in prod
    maxAge: 3 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);

    const storedRefreshToken = await redisClient.get(
      `refreshTokenKey:${decode.id}`,
    );

    if (storedRefreshToken === refreshToken) {
      return decode;
    }

    return null;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
};

export const generateAccessToken = async (id, res) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN, {
    expiresIn: "3m", // Fixed: "3m" not "3min"
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction, // Must be true if sameSite is "none"
    sameSite: isProduction ? "none" : "lax",
    maxAge: 3 * 60 * 1000,
  });
};

export const revokeRefreshToken = async (userId) => {
  try {
    await redisClient.del(`refreshTokenKey:${userId}`); // Added await
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
    throw error; // Re-throw so caller knows it failed
  }
};
