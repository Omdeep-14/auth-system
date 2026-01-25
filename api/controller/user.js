import tryCatch from "../middleware/tryCatch.js";
import sanitize from "mongo-sanitize";
import { registerschema, loginSchema } from "../config/zod.js";
import { redisClient } from "../index.js";
import { User } from "../model/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getOtpHtml, getVerifyEmailHtml } from "../config/html.js";
import sendMail from "../config/sendMail.js";
import { safeParse } from "zod";
import {
  generateAccessToken,
  verifyRefreshToken,
} from "../config/tokenGeneration.js";

export const registerUser = tryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = registerschema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;

    const validationErrors =
      zodError?.issues && Array.isArray(zodError.issues)
        ? zodError.issues.map((issue) => ({
            field: issue.path?.join(".") || "unknown",
            message: issue.message || "Validation error",
            code: issue.code,
          }))
        : [];

    const firstValidationMessage =
      validationErrors[0]?.message || "validation error";

    return res.status(400).json({
      message: firstValidationMessage,
      errors: validationErrors,
    });
  }

  const { name, email, password } = validation.data;

  const rateLimitKey = `rate-limit-key:${req.ip}:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "TOo many requests ,try again later",
    });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyKey = `verifyKey:${verifyToken}`;

  const dataStore = JSON.stringify({
    name,
    email,
    password: hashPassword,
  });

  await redisClient.set(verifyKey, dataStore, { EX: 300 });

  const subject = "Verify your email for authSystem account creation";
  const html = getVerifyEmailHtml({ email, token: verifyToken });

  await sendMail({
    email,
    subject,
    html,
  });

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.json({
    message: "Verification mail is sent ,expires in 5 minutes",
  });
});

export const verifyUser = tryCatch(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "Invalid login",
    });
  }

  const verifyKey = `verifyKey:${token}`;

  const userData = await redisClient.get(verifyKey);
  if (!userData) {
    return res.status(400).json({
      message: "The link is expired",
    });
  }

  await redisClient.del(verifyKey);

  const userDataJson = JSON.parse(userData);

  const newUser = await User.create({
    name: userDataJson.name,
    email: userDataJson.email,
    password: userDataJson.password,
  });

  res.status(201).json({
    message: "New user has been created successfully",
    details: { _id: newUser._id, name: newUser.name, email: newUser.email },
  });
});

export const loginUser = tryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validatedBody = loginSchema.safeParse(sanitizedBody);

  if (!validatedBody.success) {
    const zodError = validatedBody.error;

    const allErrors =
      zodError?.issues && Array.isArray(zodError.issues)
        ? zodError.issues.map((issue) => ({
            field: issue.path?.join(".") || "unknown",
            message: issue.message || "validation error",
            code: issue.code,
          }))
        : [];

    const firstErrorMessage = allError[0]?.message || "validation failed";

    return res.status(400).json({
      message: firstErrorMessage,
      errors: allErrors,
    });
  }

  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;

  if (redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many login attempts,please try again",
    });
  }

  const { email, password } = validatedBody.data;

  const user = User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "Wrong credentials",
    });
  }

  const comparePassword = await bcrypt.compare(password, user.password);
  if (!comparePassword) {
    return res.status(400).json({
      message: "Wrong credentials",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpKey = `otp:${email}`;

  await redisClient.set(otpKey, otp, { EX: 60 });

  const subject = "Otp for verification";

  const html = getOtpHtml({ email, otp });

  await sendMail({ email, subject, html });

  await redisClient.set(rateLimitKey, "true", { EX: 10 });

  res.status(200).json({
    message: "If your email,is valid a otp is sent to it ,valid for 1 minute",
  });
});

export const myProfile = tryCatch((req, res) => {
  const user = req.user;

  res.json(user);
});

export const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401).json({
      message: "Refresh token not found",
    });
  }

  const decode = await verifyRefreshToken(token);

  if (!decode) {
    res.status(401).json({
      message: "Refresh token invalid",
    });
  }

  generateAccessToken(decode.id, res);

  res.status(200).json({
    message: "Token refreshed",
  });
};

export const logOutUser = tryCatch(async (req, res) => {
  const userId = req.user._id;

  await revokeRefreshToken(userId);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  await redisClient.del(`user:${userId}`);

  res.json({
    message: "Log out successfully",
  });
});
