import User from "../../models/user.model.js";
import passport from "passport";
import { sendOtpToPhone } from "../utils/otp.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export const registerPatient = async (req, res) => {
  try {
    const patientsData = req.body; // Expecting an array of patients

    if (!Array.isArray(patientsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input format. Expecting an array of patients.",
      });
    }

    let processedPatients = [];

    for (let patientData of patientsData) {
      const {
        name,
        DOB,
        gender,
        user_id,
        user_type,
        contact_no,
        email_id,
        password,
        vitals = {}
      } = patientData;

      // Validation check
      if (
        !name ||
        !DOB ||
        !gender ||
        !user_id ||
        !user_type ||
        !contact_no ||
        !email_id ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All fields are required: name, DOB, gender, user_id, user_type, contact_no, email_id, and password",
        });
      }

      // Ensure registration is only allowed for patients
      if (
        user_type === "doctor" ||
        user_type === "staff" ||
        user_type === "admin"
      ) {
        return res.status(400).json({
          success: false,
          message: "Registration is allowed only for Patients",
        });
      }

      const dbUser = await User.findById(req.user._id);
      // Prevent the admin from registering themselves
      if (dbUser.user_id === user_id) {
        return res
          .status(400)
          .json({ success: false, message: "User cannot add themselves" });
      }

      const user = new User({
        name,
        DOB,
        gender,
        user_id,
        user_type,
        contact_no,
        email_id,
        vitals: {
          height: vitals.height || "",
          weight: vitals.weight || "",
          pulse: vitals.pulse || "",
          body_temp: vitals.body_temp || "",
          bp: vitals.bp || "",
          spo2: vitals.spo2 || "",
          bloodgroup: vitals.bloodgroup || ""
        }
      });

      // Register the user with the provided password
      await User.register(user, password);
      processedPatients.push(user);
    }

    res.status(201).json({
      success: true,
      message: "Patients registered successfully",
      data: processedPatients
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error: User ID or email already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "A user with the given user_id is already registered",
      error: "Internal server error or already registered",
    });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const {
      name,
      DOB,
      gender,
      user_id,
      user_type,
      contact_no,
      email_id,
      password,
    } = req.body;

    if (
      !name ||
      !DOB ||
      !gender ||
      !user_id ||
      !user_type ||
      !contact_no ||
      !email_id ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: name, DOB, gender, user_id, user_type, contact_no, email_id, and password",
      });
    }
    // Check if user_type is admin
    if (user_type !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Registration is only allowed for admin user types",
      });
    }
    // Validate user_id format
    const userIdParts = user_id.split("@");
    if (
      userIdParts.length !== 2 ||
      userIdParts[1] !== "admin" ||
      userIdParts[0].length < 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID must be in the format 'something@admin' and requires at least 5 characters before the @admin",
      });
    }
    const user = new User({
      name,
      DOB,
      gender,
      user_id,
      user_type,
      contact_no,
      email_id,
    });

    await User.register(user, password);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error: User ID or email already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "A user with the given user_id is already registered",
      error: "Internal server error or already registered",
    });
  }
};

export const registerStaffandDoctor = async (req, res) => {
  try {
    const {
      name,
      DOB,
      gender,
      user_id,
      user_type,
      contact_no,
      email_id,
      password,
    } = req.body;

    if (
      !name ||
      !DOB ||
      !gender ||
      !user_id ||
      !user_type ||
      !contact_no ||
      !email_id ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: name, DOB, gender, user_id, user_type, contact_no, email_id, and password",
      });
    }

    // Check if user_type is either doctor or staff
    if (user_type !== "doctor" && user_type !== "staff") {
      return res.status(400).json({
        success: false,
        message: "Registration is only allowed for doctor or staff user types",
      });
    }
    console.log("second step >>>> ",req.user)
    const dbUser = await User.findById(req.user._id);
    if (dbUser.user_type !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Only Admin can add other users!",
      });
    }

    // Prevent the admin from adding themselves
    if (dbUser.user_id === user_id) {
      return res.status(400).json({
        success: false,
        message: "User cannot add themselves",
      });
    }

    //using passport but not working on production
    // if (req.user.user_type !== "admin") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Only Admin can add other users!",
    //   });
    // }

    // // Prevent the admin from adding themselves
    // if (req.user.user_id === user_id) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "User cannot add themselves",
    //   });
    // }

    // Validate user_id format based on user_type
    const userIdParts = user_id.split("@");

    if (
      userIdParts.length !== 2 ||
      userIdParts[1] !== user_type ||
      userIdParts[0].length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: `User ID must be in the format 'something@${user_type}' and requires at least 5 characters before @`,
      });
    }

    const user = new User({
      name,
      DOB,
      gender,
      user_id,
      user_type,
      contact_no,
      email_id,
    });

    await User.register(user, password);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error: User ID or email already exists",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "A user with the given user_id is already registered",
      error: "Internal server error or already registered",
    });
  }
};

export const login = (req, res, next) => {
  // console.log("hi there",req.isAuthenticated())
  // console.log("i'm login now",req.user);
  // if (req.isAuthenticated()) {
  //   console.log("i'm already login ",req.user); //req.user is provided by the passport, it gives the current user
  //   return res
  //     .status(400)
  //     .json({ success: false, message: "User is already logged in" });
  // }
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(400).json({ success: false, message: info.message });

    // Perform the user_type check here
    try {
      const dbUser = await User.findById(user._id);

      if (dbUser.user_type === null) {
        return res.status(400).json({
          success: false,
          message: "You has been Deleted (Access Revoked)",
        });
      }
      if (dbUser.user_type !== req.body.user_type) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect user type" });
      }
      if (
        dbUser.user_type !== req.body.user_type ||
        (req.body.user_type !== "admin" &&
          req.body.user_type !== "doctor" &&
          req.body.user_type !== "staff")
      ) {
        return res
          .status(400)
          .json({ success: false, message: "You are not authorised to login" });
      }

      // req.logIn(user, (err) => {
      //   if (err) return next(err);
      //   const token = user.generateAuthToken();
      //   res.json({ success: true, token, userType: user.user_type });
      // });
      console.log("before save",req.session)
      req.logIn(user, (err) => {
        if (err) return next(err);
        req.session.save(() => {
            const token = user.generateAuthToken();
            res.json({ success: true, token, userType: user.user_type });
        });
      // console.log("after save",req.session)
      // console.log("hi there",req.isAuthenticated())
  // console.log("first step >>>> ",req.user);
    });    
      console.log("successfully log in");
    } catch (err) {
      return next(err);
    }
  })(req, res, next);
};

export const logout = (req, res) => {
  // console.log(req.user); //req.user is provided by the passport, it gives the current user

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    // Destroy the session and clear the cookie
    req.session.destroy((err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to destroy session" });
      }
      // Clear the session cookie and any authentication tokens
      res.clearCookie("connect.sid", { path: "/" });
      res.json({
        success: true,
        message: "Logged out and session destroyed successfully",
      });
      console.log("Successfully logged out and session destroyed");
    });
  });
  // console.log(req.user); //req.user is provided by the passport, it gives the current user
};

export const changePassword = async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  const dbUser = await User.findById(req.user._id);
    
  // Check if the user is trying to change their own password
  if (dbUser.user_id !== userId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to change this password.",
    });
  }

  if (!userId || !oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Authenticate the user with the old password
    user.authenticate(oldPassword, (err, result) => {
      if (err || !result) {
        return res
          .status(400)
          .json({ success: false, message: "Old password is incorrect" });
      }

      // Set the new password
      user.setPassword(newPassword, async (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error setting new password or Your access has revoked",
          });
        }

        await user.save();
        res
          .status(200)
          .json({ success: true, message: "Password changed successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getUserDetails = async (req, res) => {
  // console.log("getUserDetails -- mili kya",req.isAuthenticated())
  
    const dbUser = await User.findById(req.user._id);
    
  // if (dbUser) {
    
    res.status(200).json({
      success: true,
      user: dbUser, // Assuming req.user contains the authenticated user
    });
  // } else {
  //   res.status(401).json({
  //     success: false,
  //     message: "Not authenticated",
  //   });
  // }
};

export const sendOtpPhone = async (req, res) => {
  const { userId } = req.body;

  try {
    // Find the user by ID
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // // Check if the user is an admin
    // if (user.user_type === "admin") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Admin users are not allowed to reset password via OTP",
    //   });
    // }

    // Generate a random OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP before storing it in the database
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store the hashed OTP in the user document (with an expiry time if desired)
    user.otp = {
      value: hashedOtp,
      expires: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    };
    await user.save();
    console.log(user.contact_no);
    // Send the OTP to the user's phone number
    const otpSent = await sendOtpToPhone(user.contact_no, otp);
    console.log(otpSent);
    if (otpSent) {
      return res.status(200).json({
        success: true,
        message: "OTP sent to your registered phone number",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the OTP is present and valid
    if (!user.otp || !user.otp.value) {
      return res
        .status(400)
        .json({ success: false, message: "No OTP set or OTP has expired" });
    }

    // Check if the OTP has expired
    if (user.otp.expires < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    // Compare the provided OTP with the stored hashed OTP
    const isOtpValid = await bcrypt.compare(otp, user.otp.value);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    // If OTP is valid and not expired, set a flag that OTP has been verified
    user.isOtpVerified = true;
    await user.save();
    // If OTP is valid and not expired, return success
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Controller to reset password
export const resetPassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the OTP verification flag is set
    if (!user.isOtpVerified) {
      return res.status(403).json({
        success: false,
        message: "OTP verification is required to reset the password",
      });
    }

    // Update the user's password
    user.setPassword(newPassword, async (err) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Failed to reset password" });

      // Clear the OTP after successful password reset
      user.otp = undefined;
      user.isOtpVerified = undefined;
      await user.save();

      res
        .status(200)
        .json({ success: true, message: "Password reset successfully" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//that was working but it is fake smtp server
// const transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
//   port: 587,
//   secure: false, // Use `true` for port 465, `false` for all other ports
//   auth: {
//     user: "unique.hegmann3@ethereal.email",
//     pass: "TvbNArcr9djspvmsPK",
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true,
  auth: {
    user:process.env.SENDER_USER,
    pass: process.env.SENDER_PASS,
  },
});

export const sendOtpEmail = async (req, res) => {
  const { userId, user_type } = req.body;

  try {
    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.user_type === null) {
      return res.status(400).json({
        success: false,
        message: "You have been Deleted (Access Revoked)",
      });
    }

    if (user.user_type !== user_type) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect user type" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = {
      value: hashedOtp,
      expires: Date.now() + 2 * 60 * 1000, // OTP valid for 3 minutes
    };
    await user.save();

    const info = await transporter.sendMail({
      from: '"Dispensary" <vinaytheprogrammer@gmail.com>', // sender address
      to: user.email_id, // receiver's email address
      subject: "Your OTP Code", // Subject line
      text: `Your OTP code is ${otp}`, // plain text body
      html: `<b>Your OTP code is ${otp}</b>`, // html body
    });

    if (info.messageId) {
      return res.status(200).json({
        success: true,
        message: "OTP sent to your registered email address",
        otpExpiry: user.otp.expires, // Return OTP expiry time to sync with frontend timer
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// This is comment

