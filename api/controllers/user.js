import { loginSchema, registerSchema } from "../config/zod.js";
import { redisClient } from "../index.js";
import tryCatch from "../middleware/tryCatch.js";
import sanitize from "mongo-sanitize";
import { User } from "../models/user.js";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getOtpHtml, getVerifyEmailHtml } from "../config/html.js";
import bcrypt from "bcrypt";

export const registerUser = tryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = registerSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;

    const allErrors =
      zodError?.issues && Array.isArray(zodError.issues)
        ? zodError.issues.map((issue) => ({
            field: issue.path?.join(".") || "unknown",
            message: issue.message || "validation error",
            code: issue.code,
          }))
        : [];

    const firstErrorMessage = allErrors[0]?.message || "validation failed";

    return res.status(400).json({
      message: firstErrorMessage,
      errors: allErrors,
    });
  }

  const { name, email, password } = validation.data;

  const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many requests ,try again later",
    });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(400).json({
      message: "User already exists",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString("hex");

  const verifyKey = `verify:${verifyToken}`;

  const datatoStore = JSON.stringify({
    name,
    email,
    password: hashPassword,
  });

  const subject = "verify your email for authSystem account creation";
  const html = getVerifyEmailHtml({ email, token: verifyToken });

  await sendMail({
    email,
    subject,
    html,
  });

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  await redisClient.set(verifyKey, datatoStore, { EX: 300 });

  res.json({
    message:
      "If your email is valid ,a verification link is sent , it will expire in 5 minutes",
  });
});

export const verifyUser = tryCatch(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "Verification token not found",
    });
  }

  const verifyKey = `verify:${token}`;

  const userDataJson = await redisClient.get(verifyKey);

  if (!userDataJson) {
    return res.status(400).json({
      message: "the link is expired",
    });
  }

  await redisClient.del(verifyKey);

  const userData = JSON.parse(userDataJson);

  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  res.status(201).json({
    message: "Email verified successfully,your account has been created",
    user: { _id: newUser._id, name: newUser.name, email: newUser.email },
  });
});

export const loginUser = tryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = loginSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;

    const allErrors =
      zodError?.issues && Array.isArray(zodError.issues)
        ? zodError.issues.map((issue) => ({
            field: issue.path?.join(".") || "unknown",
            message: issue.message || "validation error",
            code: issue.code,
          }))
        : [];

    const firstErrorMessage = allErrors[0]?.message || "validation failed";

    return res.status(400).json({
      message: firstErrorMessage,
      errors: allErrors,
    });
  }

  const { email, password } = validation.data;

  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many requests,try again later",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  const comparePass = await bcrypt.compare(password, user.password);

  if (!comparePass) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpKey = `otp:${email}`;

  await redisClient.set(otpKey, otp, {
    EX: 300,
  });

  const subject = "Otp for verification";
  const html = getOtpHtml({ email, otp });
  await sendMail({ email, subject, html });

  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });

  res.json({
    message: "If your email is valid,an otp is sent,it is valid for 5 min",
  });
});

export const verifyOtp = tryCatch(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      message: "Please provide all details",
    });
  }

  const otpKey = `otp:${email}`;

  const storedOtpString = redisClient.get(otpKey);

  if (!storedOtpString) {
    return res.status(400).json({
      message: "Otp has been expired",
    });
  }

  const storedOtp = JSON.parse(storedOtpString);

  if (storedOtp !== otp) {
    return res.status(400).json({
      message: "Wrong otp",
    });
  }

  await redisClient.del(otpKey);

  let user = await User.findOne({ email });
});
