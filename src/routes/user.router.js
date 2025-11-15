import express from "express";
import { updateVitals, createPrescription, removeUser, SysAuthorities, viewPrescriptionList, viewPrescriptionById, bulKEntry } from "../controllers/user.controller.js";
import multer from "multer";
import path from "path"; // Ensure path is imported

import { ensureAuthenticated } from '../middlewares/auth.js';
const router = express.Router();
import { authenticateUser } from "../middlewares/auth.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


router.put("/:user_id/vitals", updateVitals);
router.post("/prescription", createPrescription);
router.post("/removeUser",authenticateUser, removeUser);
router.get("/SysAuthorities", SysAuthorities);
router.post("/viewPrescriptionList", viewPrescriptionList);
router.post("/viewPrescriptionById", viewPrescriptionById);
router.post('/bulk',upload.single('list'),bulKEntry);
export default router;
