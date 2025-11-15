//
import express from "express";
import { stockEntry, stock_update, getstock, getinfo, updateVitals, dependentinfo,dependentHistory , dependentVitals, prescriptionInProgress, updateMedicine, submitForm, getAllPrescriptions, updateHistory,setPrescriptionEdit,emailPrescription,upload } from "../controllers/staff.controller.js"
import { ensureAuthenticated } from '../middlewares/auth.js';

const router = express.Router();
 
router.post("/stock_entry", stockEntry)
router.put("/stock_update", stock_update)
router.get("/getstock", getstock)
router.post("/getinformation", getinfo)
router.put("/update", updateVitals)
router.put("/updateHistory", updateHistory)
router.post("/dependentinfo", dependentinfo)
router.put("/dependentVitals", dependentVitals)
router.put("/dependentHistory", dependentHistory)
router.get("/prescription/inproogress", prescriptionInProgress)
router.post("/medicine/update", updateMedicine)
router.post("/finalsubmit", submitForm)
router.get("/getAllPrescriptions", getAllPrescriptions )
router.post('/setPrescriptionPending', setPrescriptionEdit)
router.post('/emailPrescription', upload.single('pdf'), emailPrescription)







export default router;