import express from "express";
import passport from "passport";
import { registerPatient, registerAdmin, registerStaffandDoctor, login, logout, changePassword, getUserDetails, sendOtpPhone, verifyOtp, sendOtpEmail, resetPassword } from "../controllers/auth.controller.js";

import { ensureAuthenticated } from '../middlewares/auth.js';
import { otpRateLimiter } from "../middlewares/rateLimiter.js";
import {authenticateUser} from "../middlewares/auth.js";

const router = express.Router();
router.post("/registerPatient",authenticateUser, registerPatient); 
router.post("/registerAdmin", registerAdmin);
router.post("/registerStaffandDoctor",authenticateUser, registerStaffandDoctor);
router.post("/login", login);
router.post("/logout", logout);
router.post("/change-password",authenticateUser, changePassword); // Add this line
router.get('/user-details',authenticateUser, getUserDetails);
router.post('/send-otp-phoneno', sendOtpPhone);
router.post('/verify-otp', verifyOtp);
router.post('/send-otp-email', otpRateLimiter, sendOtpEmail);
router.post('/reset-pass', resetPassword);
export default router;
