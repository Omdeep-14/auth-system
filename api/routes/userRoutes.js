import {
  adminController,
  loginUser,
  logOutUser,
  myProfile,
  refreshAccessToken,
  refreshCSRF,
  registerUser,
  verifyOtp,
  verifyUser,
} from "../controller/user.js";
import express from "express";
import { authorizedAdmin, isAuth } from "../middleware/isAuth.js";
import { verifyCSRFToken } from "../config/csrfMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verifyotp", verifyOtp);
router.post("/logout", isAuth, verifyCSRFToken, logOutUser);
router.get("/me", isAuth, myProfile);
router.post("/refresh", refreshAccessToken);
router.post("/refresh-csrf", isAuth, refreshCSRF);
router.get("/admin", isAuth, authorizedAdmin, adminController);

export default router;
