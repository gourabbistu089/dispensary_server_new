import express from 'express';
import {
  getDoctorQueue,
  updatePrescription,
  deletePrescription,
  getCompletedPrescriptions,
  addMedicineToPrescription,
  removeMedicineFromPrescription,
  editMedicineInPrescription,
  getTodayCompletedPrescriptions,
  addMemory,
  getMemory
} from '../controllers/doctor.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.get('/queue', getDoctorQueue);
router.put('/prescription/update', updatePrescription);
router.delete('/prescription/delete/:id', deletePrescription);
router.get('/doctor/completed-prescriptions', getCompletedPrescriptions);   //to show completed pres
router.get('/doctor/today-completed-prescriptions', getTodayCompletedPrescriptions); //today completed pres
router.post('/prescription/:prescription_id/add-medicine', addMedicineToPrescription);// to add medicine in pres
router.delete('/prescription/:prescription_id/remove-medicine', removeMedicineFromPrescription); // to remove medicine prescription
router.put('/prescription/:prescription_id/edit-medicine', editMedicineInPrescription); // Add this route
router.post('/add-memory', addMemory);
router.get('/get-memory', getMemory);
export default router;
