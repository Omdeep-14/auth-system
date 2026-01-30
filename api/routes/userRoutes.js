import {
  loginUser,
  logOutUser,
  myProfile,
  refreshAccessToken,
  registerUser,
  verifyOtp,
  verifyUser,
} from "../controller/user.js";
import express from "express";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verifyotp", verifyOtp);
router.post("/logout", isAuth, logOutUser);
router.get("/me", isAuth, myProfile);
router.post("/refresh", refreshAccessToken);

export default router;
