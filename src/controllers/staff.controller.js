import { Medicine } from "../../models/medicine.model.js";
import User from "../../models/user.model.js";
import Dependent from "../../models/dependent.model.js";
import Prescription from "../../models/prescription.model.js";
import moment from 'moment';

//for sending mail
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { presciptionEmailTemplate } from "../utils/presciptionEmailTemplate.js";

// Configure multer for file uploads
export const upload = multer({ dest: 'uploads/' });

export const emailPrescription = async (req, res) => {
  try {
    if(!req.file){
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const {patientId, doctorName, doctorEmail} = req.body;
    const pdfPath = req.file.path;
    const patient = await User.findOne({ user_id: patientId });
    const email = patient.email_id;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "team.colatodo@gmail.com",
        pass: `${process.env.APP_PASSWORD}`
      },
    }); 

    const html = presciptionEmailTemplate({
      patientName: patient.name,
      doctorName: doctorName,
      doctorEmail: doctorEmail,
    });
    // console.log(html);  

    // Define email options
    const mailOptions = {
      from: 'team.colatodo@gmail.com',
      to: email,
      subject: 'Patient Prescription',
      html: html,
      text: `Please find attached  prescription`,
      attachments: [
        {
          filename: req.file.originalname || 'prescription.pdf',
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    fs.unlinkSync(pdfPath);

    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
};

//to feed in postman Array of medicines
export const stockEntry = async (req, res) => {
  let medicinesData = req.body; // Expecting an array of medicines

  if (!Array.isArray(medicinesData)) {
    return res.status(400).json({
      success: false,
      message: "Invalid input format. Expecting an array of medicines.",
    });
  }

  try {
    let processedMedicines = [];

    for (let data of medicinesData) {
      const {
        M_name,
        salt,
        batches,
        brand_name,
        type
      } = data;
      
      
      // Find the medicine by its name
      let medicine = await Medicine.findOne({ M_name });

      if (medicine) {
        // Update existing medicine
        batches.forEach((newBatch) => {
          const existingBatch = medicine.batches.find(
            (batch) => batch.batch_no === newBatch.batch_no
          );
          if (existingBatch) {
            // Update existing batch
            existingBatch.expiry = newBatch.expiry;
            medicine.quantity -= existingBatch.b_quantity;
            existingBatch.b_quantity = newBatch.b_quantity;
            medicine.quantity += existingBatch.b_quantity;
          } else {
            // Add new batch

            medicine.batches.push(newBatch);
            medicine.quantity += newBatch.b_quantity;
          }
        });
        // Update other details
        medicine.brand_name = brand_name; 
        await medicine.save();
        processedMedicines.push(medicine);
      } else {
        // Create new medicine if not found
        const newMedicine = new Medicine({
          M_name,
          salt,
          batches,
          brand_name,
          quantity: batches.reduce((sum, batch) => sum + batch.b_quantity, 0),
          type
        });

        await newMedicine.save();
        processedMedicines.push(newMedicine);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Medicines processed successfully",
      data: processedMedicines,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the request",
      error: error.message,
    });
  }
};

export const stock_update = async (req, res) => {
  let { M_name, quantity, _id,medicine_Id  } = req.body;

  try {
    let presciption = await Prescription.findById(_id);

    let finalqty = quantity;
    // Find the medicine by name
    let medicine = await Medicine.findOne({ M_name });

    let ind = -1;
    const med = presciption.medicine;
    for (let i = 0; i < med.length; i++) {
      if (med[i]._id == medicine_Id) {
        ind = i;
        break;
      }
    }

    if (medicine) {
      if (medicine.quantity >= quantity) {
        console.log("if case runs ",ind, medicine_Id);
        medicine.quantity -= quantity;
        finalqty = 0;
        const presciption = await Prescription.findOne({_id: _id});
        presciption.medicine[ind].status= "deducted";
        await presciption.save();
        await medicine.save();
        return res.status(200).json({
          success: true,
          message: "Medicine quantity deducted successfully",
          data: medicine,
        });
      } else if (medicine.quantity == 0) {
        console.log("else if case runs");
        return res.status(400).json({
          success: false,
          message: "Out of stock",
        });
      } else {
        console.log("else case runs");
        finalqty -= medicine.quantity;
        medicine.quantity = 0;
        await Prescription.updateOne(
          { _id: _id },
          {
            $set: {
               [`medicine.${ind}.status`]: "deducted"
            },
          }
        );
        await medicine.save();
        return res.status(200).json({
          success: true,
          message: "Medicine quantity deducted successfully",
          data: medicine,
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the request",
      error: error.message,
    });
  }
};

export const getstock = async (req, res) => {
  try {
    const currentDate = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(currentDate.getMonth() + 2);
    const results = await Medicine.aggregate([
      {
        $unwind: "$batches",
      },
      {
        $match: {
          "batches.expiry": { $gte: currentDate },
        },
      },
      {
        $group: {
          _id: "$M_name", 
          totalQuantity: { $first: "$quantity" }, 
          closestExpiryDate: { $min: "$batches.expiry" }, 
          batches: { $push: "$batches" },
          invoice_data: {
            $push: {
              invoice_no: "$batches.invoice_no",
              invoice_date: "$batches.invoice_date",
              brand_name: "$brand_name",
            },
          },
          type: { $first: "$type" }, // Add type to the group stage
        },
      },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          closestExpiryDate: 1,
          batch_no: {
            $arrayElemAt: [
              "$batches.batch_no",
              {
                $indexOfArray: ["$batches.expiry", "$closestExpiryDate"],
              },
            ],
          }, // Find the batch_no corresponding to the closest expiry date
          invoice_data: 1,
          type: 1, // Include type in the project stage
        },
      },
      {
        $project: {
          _id: 0, // Exclude the `_id` field from the output
          M_name: "$_id", // Rename `_id` to `M_name`
          totalQuantity: 1,
          closestExpiryDate: 1,
          batch_no: 1,
          invoice_no: { $arrayElemAt: ["$invoice_data.invoice_no", 0] }, // Retrieve the first invoice_no
          invoice_date: { $arrayElemAt: ["$invoice_data.invoice_date", 0] }, // Retrieve the first invoice_date
          brand_name: { $arrayElemAt: ["$invoice_data.brand_name", 0] }, // Retrieve the first brand_name
          type: 1, // Include type in the final output
        },
      },
    ]);    
    const formattedResults = results.map((item) => ({
      ...item,
      closestExpiryDate: new Date(item.closestExpiryDate)
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-"),
      invoice_date: new Date(item.invoice_date)
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-"),
    }));

    // Check if any medicine is expiring within 2 months
    const expiringSoon = formattedResults.filter((item) => {
      const expiryDate = new Date(item.closestExpiryDate.split("-").reverse().join("-"));
      return expiryDate <= twoMonthsFromNow;
    });

    res.status(200).json({
      success: true,
      data: formattedResults,
      expiringSoon: expiringSoon.length > 0 ? expiringSoon : null, // Send expiring soon medicines if available
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the data",
      error: error.message,
    });
  }
};

export const getinfo = async (req, res) => {
  try {
    const { user_id, user_type } = req.body;
    
    // Check if user_id is provided
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // Find the user and populate the dependents field
    const user = await User.findOne({ user_id }).populate("dependents");    
    if (user) {
      // Check if the user_type matches
      if (user_type === "dependent" && user.user_type === "employee") {
        res.status(200).json({
          success: true,
          message: "User found",
          data: user,
        });
      } else if (user_type === user.user_type) {
        res.status(200).json({
          success: true,
          message: "User found",
          data: user,
        });
      } else {

        res.status(403).json({
          success: false,
          message: "User type mismatch",
        });
      }
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      console.log("User not in database");
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
    console.error("Error fetching user info:", error);
  }
};

export const updateVitals = async (req, res) => {
  const { user_id, height, weight,pulse, body_temp, bp, spo2,RandomBloodSugar, bloodgroup } = req.body;

  try {
    // Find the user by user_id
    const user = await User.findOne({ user_id });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user vitals
    user.vitals.height = height;
    user.vitals.weight = weight;
    user.vitals.body_temp = body_temp;
    user.vitals.pulse = pulse;
    user.vitals.bp = bp;
    user.vitals.spo2 = spo2;
    user.vitals.RandomBloodSugar = RandomBloodSugar;
    user.vitals.bloodgroup = bloodgroup;
    // Save the updated user back to the database
    await user.save();

    return res
      .status(200)
      .json({ message: "Vitals updated successfully", user });
  } catch (error) {
    console.log(error);
    console.error(`Error updating vitals for user_id: ${user_id}`, error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const updateHistory = async (req, res) => {
  const { user_id, relevant, treatment } = req.body;
  console.log("id from user "+user_id);
  
  try {
    // Find the user by user_id    
    const user = await User.findOne({ user_id });
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user History
    user.History.relevant = relevant;
    user.History.treatment = treatment;

    // Save the updated user back to the database
    await user.save();

    return res
      .status(200)
      .json({ message: "History updated successfully", user });
  } catch (error) {
    console.log(error);
    console.error(`Error updating History for user_id: ${user_id}`, error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const dependentinfo = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id in request body" });
    }

    const user = await User.findOne({
      user_id: user_id,
      user_type: "employee",
    }).populate("dependents");

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found or not an employee" });
    }

    const dep = user.dependents.filter((dependent) => {
      if(dependent.relation != 'child') return true;
      const calculatedAge = moment().diff(moment(dependent.DOB), 'years');
        if (
          (dependent.gender === "male" && calculatedAge < 25) ||
          (dependent.gender === "female" && !dependent.marital_status)
        ) {
          return true;
        }
        return false;
    });

    return res.status(200).json({
      success: true,
      message: "dependent fetched successfully",
      data: dep,
    });
  } catch (error) {
    console.error("Error retrieving dependents:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const dependentVitals = async (req, res) => {
  const { user_id, bp, height, weight,pulse, spo2, body_temp,RandomBloodSugar,bloodgroup } = req.body;
  try {
    // Find the dependent user by ID
    const user = await Dependent.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's vitals
    user.vitals = {
      bp,
      height,
      weight,
      pulse,
      spo2,
      body_temp,
      RandomBloodSugar,
    };

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: "Vitals updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const dependentHistory = async (req, res) => {
  const { user_id, relevant, treatment} = req.body;
  try {
    // Find the dependent user by ID
    const user = await Dependent.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's vitals
    user.History = {
      relevant,
      treatment,
    };

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: "History updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export const prescriptionInProgress = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: "inprogress" })
      .populate("user_id")
      .populate("dep_id")
      .populate("doctor_id");

    const formattedData = prescriptions
      .map((prescription) => {
        if (prescription.user_id) {
          return {
            id: prescription._id,
            name: prescription.user_id.name || "Unknown",
            gender: prescription.user_id.gender || "Unknown",
            status: prescription.status,
            user_id: prescription.user_id.user_id || "Unknown",// Safeguard null '_id'
            doctor_id: prescription.doctor_id.user_id,
            doctor_name: prescription.doctor_id.name, 
            doctor_mail: prescription.doctor_id.email_id,
            medicine: prescription.medicine,
            purpose: prescription.purpose,
            presentComplaints: prescription.presentComplaints,
            provisionalDiagnosis: prescription.provisionalDiagnosis || "Unknown",
            value_id: prescription._id,
            updatedAt: prescription.updatedAt,
            vitals: prescription.user_id.vitals,
            contact_no: prescription.user_id.contact_no,
            clinical_finding: prescription.clinical_finding,
            investigation: prescription.investigation,
            remarks: prescription.remarks,
            relevant: prescription.user_id.History.relevant,
            treatment: prescription.user_id.History.treatment,
            other: prescription.other,
          };
        } else if (prescription.dep_id) {
          return {
            id: prescription._id,
            name: prescription.dep_id.name || "Unknown",
            gender: prescription.dep_id.gender || "Unknown",
            status: prescription.status,
            user_id: "Dependent", // As per your logic, use "Dependent" for dep_id
            doctor_id: prescription.doctor_id.user_id,
            doctor_name: prescription.doctor_id.name, 
            doctor_mail: prescription.doctor_id.email_id,
            medicine: prescription.medicine,
            purpose: prescription.purpose,
            presentComplaints: prescription.presentComplaints,
            provisionalDiagnosis: prescription.provisionalDiagnosis,
            value_id: prescription._id,
            updatedAt: prescription.updatedAt,
            vitals: prescription.dep_id.vitals,
            contact_no:prescription.dep_id.contact_no,
            clinical_finding: prescription.clinical_finding,
            investigation: prescription.investigation,
            remarks: prescription.remarks,
            relevant: prescription.dep_id.History.relevant,
            treatment: prescription.dep_id.History.treatment,
            other: prescription.other,
          };
        }

        return null; // In case neither user_id nor dep_id exists
      })
      .filter((item) => item !== null); // Remove null entries
    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error retrieving prescriptions:", error);
    res.status(500).json({ error: "Failed to retrieve prescriptions" });
  }
};

export const setPrescriptionEdit= async (req, res) => {
  try {
    const {id} = req.body;
    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    prescription.status = "edit";
    await prescription.save();

    return res.status(200).json({
      success: true,
      message: "Prescription status updated to inprogress",
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the prescription",
      error: error.message,
    });
  }
};



export const updateMedicine = async (req, res) => {
  try {
    const { value_id } = req.body;

    const prescription = await Prescription.findById(value_id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medicine quantity retrieved successfully",
      data: prescription.medicine,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the prescription",
      error: error.message,
    });
  }
};

export const submitForm = async (req, res) => {
  try {
    const { value_id } = req.body;
    const prescription = await Prescription.findById(value_id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }
    prescription.status = "completed";
    await prescription.save();

    return res.status(200).json({
      success: true,
      message: "Prescription status updated to completed",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the prescription",
      error: error.message,
    });
  }
};


export const getAllPrescriptions = async (req, res) => {
  try {
      let { startDate, endDate } = req.query;

      // Convert to Date objects if startDate and endDate are provided
      let query = {};
      if (startDate && endDate) {
          startDate = new Date(startDate);
          endDate = new Date(endDate);

          // Add one day to endDate to include all prescriptions up to the end of the day
          endDate.setHours(23, 59, 59, 999);

          query = {
              createdAt: {
                  $gte: startDate,
                  $lte: endDate
              }
          };
      }

      const prescriptions = await Prescription.find(query).populate('user_id').populate('dep_id');
      // Get the current date and calculate 2 months from now
      const currentDate = new Date();
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

      // Track medicines expiring within 2 months
      const expiringMedicines = [];

      // Iterate through each prescription and its medicines
      prescriptions.forEach((prescription) => {
          prescription.medicine.forEach((med) => {
              if (med.expiryDate) {
                  const medExpiryDate = new Date(med.expiryDate);

                  // Check if the medicine is expiring within the next 2 months
                  if (medExpiryDate <= twoMonthsFromNow && medExpiryDate > currentDate) {
                      expiringMedicines.push({
                          prescriptionId: prescription._id,
                          medicine: med.M_name,
                          expiryDate: med.expiryDate
                      });
                  }
              }
          });
      });

      res.status(200).json({ prescriptions, expiringMedicines });
  } catch (error) {
      console.error('Error fetching prescriptions:', error);
      res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};


