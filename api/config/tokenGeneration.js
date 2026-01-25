import jwt from "jsonwebtoken";
import { redisClient } from "..";
import { refreshToken } from "../../../../New folder/auth-system/api/controllers/user";
import tryCatch from "../middleware/tryCatch";

export const generateToken = async (id, res) => {
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN, {
    expiresIn: "7d",
  });

  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN, {
    expiresIn: "3min",
  });

  const refreshTokenKey = `refreshTokenKey:${id}`;

  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    // secure: true,
    sameSite: "none",
    maxAge: 3 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    // secure: true,
    sameSite: "none",
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
    return null;
  }
};

export const generateAccessToken = async (id, res) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN, {
    expiresIn: "3min",
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    // secure: false,
    sameSite: "none",
    maxAge: 3 * 60 * 1000,
  });
};

export const revokeRefreshToken = async (userId) => {
  redisClient.del(`refreshTokenKey:${userId}`);
};
