
import express from "express";
import { addDependent, getAllEmployeesWithDependents  } from "../controllers/dependent.controller.js";
import { ensureAuthenticated } from '../middlewares/auth.js';

const router= express.Router();

router.post("/user/:user_id/dependents" ,addDependent);
router.get('/employees', getAllEmployeesWithDependents);

export default router;