import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
import { generateCSRFToken, revokeCSRFToken } from "./csrfMiddleware.js";
import crypto from "crypto";

export const generateToken = async (id, res) => {
  const sessionId = crypto.randomBytes(16).toString("hex");

  const refreshToken = jwt.sign({ id, sessionId }, process.env.REFRESH_TOKEN, {
    expiresIn: "7d",
  });

  const accessToken = jwt.sign({ id, sessionId }, process.env.ACCESS_TOKEN, {
    expiresIn: "3m",
  });

  const refreshTokenKey = `refreshTokenKey:${id}`;
  const activeSessionKey = `active_session:${id}`;
  const sessionDataKey = `session:${sessionId}`;

  const existingSession = await redisClient.get(activeSessionKey);
  if (existingSession) {
    await redisClient.del(`session:${existingSession}`);
  }

  const sessionData = {
    userId: id,
    sessionId,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);
  await redisClient.setEx(
    sessionDataKey,
    7 * 24 * 60 * 60,
    JSON.stringify(sessionData),
  );
  await redisClient.set(activeSessionKey, sessionId);

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 3 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const csrfToken = await generateCSRFToken(id, res);

  return { accessToken, refreshToken, csrfToken, sessionId };
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);

    const storedRefreshToken = await redisClient.get(
      `refreshTokenKey:${decode.id}`,
    );

    if (storedRefreshToken !== refreshToken) {
      return null;
    }

    const activeSessionId = await redisClient.get(
      `active_session:${decode.id}`,
    );

    if (activeSessionId !== decode.sessionId) {
      return null;
    }

    const sessionData = await redisClient.get(`session:${decode.sessionId}`);
    if (!sessionData) {
      return null;
    }

    const parsedSessionData = JSON.parse(sessionData);
    parsedSessionData.lastActivity = new Date().toISOString();

    await redisClient.setEx(
      `session:${decode.sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify(parsedSessionData),
    );

    return decode;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
};

export const generateAccessToken = async (id, sessionId, res) => {
  const accessToken = jwt.sign({ id, sessionId }, process.env.ACCESS_TOKEN, {
    expiresIn: "3m",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 3 * 60 * 1000,
  });
};

export const revokeRefreshToken = async (userId) => {
  try {
    const activeSessionId = await redisClient.get(`active_session:${userId}`);
    await redisClient.del(`refreshTokenKey:${userId}`);
    await redisClient.del(`active_session:${userId}`);
    if (activeSessionId) {
      await redisClient.del(`session:${activeSessionId}`);
    }
    await revokeCSRFToken(userId);
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
    throw error;
  }
};

export const isSessionActive = async (userId, sessionId) => {
  const activeSessionId = await redisClient.get(`active_session:${userId}`);
  return activeSessionId === sessionId;
};
