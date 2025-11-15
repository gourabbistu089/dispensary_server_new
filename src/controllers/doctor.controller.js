//
import Prescription from '../../models/prescription.model.js';
import { Medicine } from '../../models/medicine.model.js';
import  Dependent  from '../../models/dependent.model.js';
import User from "../../models/user.model.js";
import {getSocketInstance} from '../socket/socket.js'
import Memory from '../../models/memory.model.js';


// export const getDoctorQueue = async (req, res) => {
//   try {
//     const prescriptions = await Prescription.find({ status: 'pending' }).populate('user_id').populate('dep_id');
//     res.status(200).json(prescriptions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const addMemory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const newMemory = new Memory({ name, type });
    await newMemory.save();
    res.status(201).json(newMemory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMemory = async (req, res) => {
  try {
    const otherMedicineMemories = await Memory.find({ type: 'othermedicine' });
    const adviceMemories = await Memory.find({ type: 'advice' });
    res.status(200).json({ otherMedicineMemories, adviceMemories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getDoctorQueue = async (req, res) => {
  try {
    // Fetch prescriptions with status 'pending' and ensure either user_id or dep_id is populated
    const prescriptions = await Prescription.find({
      status: 'pending',
      $or: [
        { user_id: { $ne: null } }, // Only include documents where user_id is not null
        { dep_id: { $ne: null } },  // Only include documents where dep_id is not null
      ]
    }).populate('user_id').populate('dep_id');

    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;    
    if (!id || id.trim() === "") {
      return res.status(400).json({ error: "Invalid prescription ID provided." });
    }
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }
    const user_id = prescription.user_id;
    const dep_id = prescription.dep_id;
    if(user_id){
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ error: "User associated with this prescription not found." });
      }
      user.prescriptions = user.prescriptions.filter(
        (prescriptionId) => prescriptionId.toString() !== id
      );
      await user.save();
    }else if(dep_id){
      const dep = await Dependent.findById(dep_id);
      if (!dep) {
        return res.status(404).json({ error: "Dependent associated with this prescription not found." });
      }
      dep.prescriptions = dep.prescriptions.filter(
        (prescriptionId) => prescriptionId.toString() !== id
      );
      await dep.save();
    }


    await Prescription.deleteOne({ _id: id });
    res.status(200).json({
      message: "Prescription deleted successfully.",
      prescriptionId: id,
    });

  } catch (error) {
    console.error("Error in deletePrescription:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid prescription ID format." });
    }
    res.status(500).json({
      error: "An internal server error occurred while deleting the prescription.",
    });
  }
};



export const updatePrescription = async (req, res) => {
  try {

    const { prescription_id, purpose, clinical_finding, investigation, medicine, remarks, other,user,presentComplaints, provisionalDiagnosis,height,weight,pulse,bloodgroup,bp,spo2,body_temp,RandomBloodSugar,patientId } = req.body;
    const prescription = await Prescription.findById(prescription_id);
    // console.log(presentComplaints)
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    const Dr = await User.findOne({user_id :user});  
    // console.log(user);

    // update prescription
    prescription.doctor_id = Dr ;
    prescription.purpose = purpose || prescription.purpose;
    prescription.clinical_finding = clinical_finding || prescription.clinical_finding;
    prescription.investigation = investigation || prescription.investigation;
    prescription.medicine = medicine || prescription.medicine;
    prescription.remarks = remarks || prescription.remarks;
    prescription.other = other || prescription.other;
    prescription.presentComplaints = presentComplaints;
    prescription.provisionalDiagnosis = provisionalDiagnosis;
    prescription.status = 'inprogress';

    await prescription.save();


    // update user (patient)
    // console.log("patientId",patientId)
    let patient = await User.findOne({_id :patientId});
    if(!patient){
        patient = await Dependent.findOne({_id :patientId});
    }
    // console.log(patient);
    patient.vitals.height = height || patient.vitals.height;
    patient.vitals.weight = weight || patient.vitals.weight;
    patient.vitals.pulse = pulse || patient.vitals.pulse;
    patient.vitals.bloodgroup = bloodgroup || patient.vitals.bloodgroup;
    patient.vitals.bp = bp || patient.vitals.bp;
    patient.vitals.spo2 = spo2 || patient.vitals.spo2;
    patient.vitals.body_temp = body_temp || patient.vitals.body_temp;
    patient.vitals.RandomBloodSugar = RandomBloodSugar || patient.vitals.RandomBloodSugar;
    await patient.save();

    const populatedConsultedAppointment = await Prescription.findById(prescription_id).populate("user_id").populate("dep_id").populate('doctor_id');
    let formattedData;
    if (populatedConsultedAppointment.user_id) {
      formattedData= {
        id: populatedConsultedAppointment._id,
        name: populatedConsultedAppointment.user_id.name || "Unknown",
        gender: populatedConsultedAppointment.user_id.gender || "Unknown",
        status: populatedConsultedAppointment.status,
        user_id: populatedConsultedAppointment.user_id.user_id || "Unknown",// Safeguard null '_id'
        doctor_id: populatedConsultedAppointment.doctor_id.user_id,
        doctor_name: populatedConsultedAppointment.doctor_id.name, 
        doctor_mail: populatedConsultedAppointment.doctor_id.email_id,
        medicine: populatedConsultedAppointment.medicine,
        purpose: populatedConsultedAppointment.purpose,
        presentComplaints: populatedConsultedAppointment.presentComplaints,
        value_id: populatedConsultedAppointment._id,
        updatedAt: populatedConsultedAppointment.updatedAt,
        vitals: populatedConsultedAppointment.user_id.vitals,
        contact_no: populatedConsultedAppointment.user_id.contact_no,
        clinical_finding: populatedConsultedAppointment.clinical_finding,
        investigation: populatedConsultedAppointment.investigation,
        remarks: populatedConsultedAppointment.remarks,
        relevant: populatedConsultedAppointment.user_id.History.relevant,
        treatment: populatedConsultedAppointment.user_id.History.treatment,
        other: populatedConsultedAppointment.other,
      };
    } else if (populatedConsultedAppointment.dep_id) {
      formattedData= {
        id: populatedConsultedAppointment._id,
        name: populatedConsultedAppointment.dep_id.name || "Unknown",
        gender: populatedConsultedAppointment.dep_id.gender || "Unknown",
        status: populatedConsultedAppointment.status,
        user_id: "Dependent", // As per your logic, use "Dependent" for dep_id
        doctor_id: populatedConsultedAppointment.doctor_id.user_id,
        doctor_name: populatedConsultedAppointment.doctor_id.name, 
        doctor_mail: populatedConsultedAppointment.doctor_id.email_id,
        medicine: populatedConsultedAppointment.medicine,
        purpose: populatedConsultedAppointment.purpose,
        presentComplaints: populatedConsultedAppointment.presentComplaints,
        value_id: populatedConsultedAppointment._id,
        updatedAt: populatedConsultedAppointment.updatedAt,
        vitals: populatedConsultedAppointment.dep_id.vitals,
        contact_no:populatedConsultedAppointment.dep_id.contact_no,
        clinical_finding: populatedConsultedAppointment.clinical_finding,
        investigation: populatedConsultedAppointment.investigation,
        remarks: populatedConsultedAppointment.remarks,
        relevant: populatedConsultedAppointment.dep_id.History.relevant,
        treatment: populatedConsultedAppointment.dep_id.History.treatment,
        other: populatedConsultedAppointment.other,
      };
    }
    // console.log(formattedData)

    const io=getSocketInstance();
    io.emit("new-consultedAppointment",{formattedData})


    res.status(200).json({ message: 'Prescription updated successfully', prescription });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};

export const getCompletedPrescriptions = async (req, res) => {
  try {
    const completedPrescriptions = await Prescription.find({ status: 'completed' }).populate('user_id').populate('dep_id');
    res.status(200).json(completedPrescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTodayCompletedPrescriptions = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayCompletedPrescriptions = await Prescription.find({
      status: { $in: ['completed', 'inprogress' , 'edit'] },
      updatedAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate('user_id').populate('dep_id');

    res.status(200).json(todayCompletedPrescriptions);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};


export const addMedicineToPrescription = async (req, res) => {
  try {
    const { prescription_id } = req.params;
    const { M_name, quantity, dailydose, days } = req.body;

    const prescription = await Prescription.findById(prescription_id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const medicine = await Medicine.findOne({ M_name: M_name });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Get the ObjectId of the medicine
    const medicine_id = medicine._id;


    // Check if the medicine is already in the prescription

    console.log("working");
    const existingMedicine = prescription.medicine.find((m) => m.medicine_id.equals(medicine_id));
    console.log("working1");
    if (existingMedicine) {

      return res.status(200).json({ message: 'Medicine already added' });
    } else {
      // Add new medicine to the prescription
      prescription.medicine.push({ medicine_id, quantity, dailydose, days });
    }

    // Save the updated prescription
    await prescription.save();

    res.status(200).json({ message: 'Medicine added successfully', prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const removeMedicineFromPrescription = async (req, res) => {
  try {
    const { prescription_id } = req.params;
    const { M_name } = req.body;

    const medicine = await Medicine.findOne({ M_name: M_name });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const medicine_id = medicine._id;

    // Find the prescription by ID
    const prescription = await Prescription.findById(prescription_id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check if the medicine is in the prescription
    const medicineIndex = prescription.medicine.findIndex((m) => m.medicine_id.equals(medicine_id));
    if (medicineIndex === -1) {
      return res.status(404).json({ error: 'Medicine not found in prescription' });
    }

    // Remove the medicine from the prescription
    prescription.medicine.splice(medicineIndex, 1);

    // Save the updated prescription
    await prescription.save();

    res.status(200).json({ message: 'Medicine removed successfully', prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const editMedicineInPrescription = async (req, res) => {
  try {
    const { prescription_id } = req.params;
    const { M_name, quantity, dailydose, days } = req.body;

    const medicineT = await Medicine.findOne({ M_name: M_name });
    if (!medicineT) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const medicine_id = medicineT._id;

    // Find the prescription by ID
    const prescription = await Prescription.findById(prescription_id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check if the medicine is already in the prescription
    const medicine = prescription.medicine.find((m) => m.medicine_id.equals(medicine_id));
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found in prescription' });
    }

    // Update medicine details
    medicine.quantity = quantity || medicine.quantity;
    medicine.dailydose = dailydose || medicine.dailydose;
    medicine.days = days || medicine.days;

    // Save the updated prescription
    await prescription.save();

    res.status(200).json({ message: 'Medicine updated successfully', prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};