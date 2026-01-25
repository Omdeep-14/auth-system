import { registerUser, verifyUser } from "../controller/user.js";
import express from "express";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
export default router;
