import User from "../../models/user.model.js";
import Prescription from "../../models/prescription.model.js";
import Dependent from "../../models/dependent.model.js";
import { error } from "console";
import {getSocketInstance} from '../socket/socket.js'
import csv from "csv-parser"
import fs from "fs"
export const updateVitals = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { height, weight, body_temp, bp, spo2,pulse } = req.body;

    const user = await User.findOne({ user_id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.vitals = {
      height: height || user.vitals.height,
      pulse: pulse || user.vitals.pulse,
      weight: weight || user.vitals.weight,
      body_temp: body_temp || user.vitals.body_temp,
      bp: bp || user.vitals.bp,
      spo2: spo2 || user.vitals.spo2,
    };

    await user.save();

    res.status(200).json({ message: 'Vitals updated successfully', vitals: user.vitals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { user_id, purpose, opd, dependent, dependent_id, presentComplaints } = req.body;
    let user;
    let dep_id = null;
    let userId = null;
    
    if (dependent) {
      user = await Dependent.findById(dependent_id);
      dep_id = user ? user._id : null;
      if (!user) {
        return res.status(404).json({ error: 'Dependent not found' });
      }
    } else {
      user = await User.findOne({ user_id });
      userId = user ? user._id : null;
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    let ongoingPrescription;

if (dep_id) {
  ongoingPrescription = await Prescription.findOne({
    dep_id: dep_id,
    status: { $ne: 'completed' }
  });
} else {
  ongoingPrescription = await Prescription.findOne({
    user_id: userId,
    status: { $ne: 'completed' }
  });
}

    if (ongoingPrescription) {
      return res.status(400).json({
        error: 'There is already an ongoing prescription for this user/dependent.'
      });
    }

    const newPrescription = new Prescription({
      user_id: userId,
      dep_id: dep_id,
      purpose,
      presentComplaints,
      opd,
      clinical_finding: "",
      investigation: "",
      medicine: [],
      remarks: "",
      status: "pending"
    });

    await newPrescription.save();
    user.prescriptions.push(newPrescription._id);
    await user.save();


  const populatedPrescription = await Prescription.findById(newPrescription._id).populate('user_id').populate('dep_id'); 
    
  const io=getSocketInstance();
    io.emit("new-prescription",{populatedPrescription})

    res.status(201).json({
      message: 'Prescription created successfully and added to queue',
      prescription: newPrescription
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const io=getSocketInstance();
    const dbUser = await User.findById(req.user._id);

    // Check if the logged-in user is an admin
    if (dbUser.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only Admin can remove other Users!"
      });
    }

    // Retrieve the user_id and remarks from the request body
    const { user_id, remarks } = req.body;

    // Find the user by user_id
    let user = await User.findOne({ user_id: user_id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent the admin from deleting themselves
    if (dbUser.user_id === user_id) {
      return res.status(400).json({ success: false, message: "Admin cannot delete themselves" });
    }

    // Add user_id to the remarks
    const updatedRemarks = `${remarks} and User_Type was: ${user.user_type}`;

    // Check if the user type is staff, doctor, or admin before removing
    if (['staff', 'doctor', 'admin'].includes(user.user_type)) {
      // Update the user_type to null and save the updated remarks
      user = await User.findOneAndUpdate(
        { user_id: user_id },
        { user_type: null, remarks: updatedRemarks },  // Store updated remarks in the user's record
        { new: true }
      );

      io.emit("access-revoked",{user_id})
      // Invalidate the session of the user being removed
      // req.logout((err) => {
      //   if (err) {
      //     return res.status(500).json({ success: false, message: err.message });
      //   }

      //   // Destroy the session and clear the cookie
      //   req.session.destroy((err) => {
      //     if (err) {
      //       return res.status(500).json({ success: false, message: "Failed to destroy session" });
      //     }
      //     res.clearCookie("connect.sid", { path: "/" });
      //     res.status(200).json({
      //       success: true,
      //       message: "User removed, logged out, and session destroyed successfully",
      //       data: user
      //     });
      //     console.log("Successfully removed user and destroyed session");
      //   });
      // });
      return res.status(200).json({
        success: true,
        message: "User removed successfully",
        data: user
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "This User cannot be deleted. Deletion is allowed only for staff, doctor, and admin, or user already deleted."
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const SysAuthorities = async (req, res) => {
  // if (req.user.user_type !== 'admin') {
  //   return res.status(403).json({
  //     success: false,
  //     message: "Only Admin can View other Users!"
  //   });
  // }

  try {
    // Fetch active users where user_id ends with @admin, @doctor, or @staff and user_type is not null
    const activeAdmins = await User.find({ user_id: /@admin$/, user_type: { $ne: null } });
    const activeDoctors = await User.find({ user_id: /@doctor$/, user_type: { $ne: null } });
    const activeStaff = await User.find({ user_id: /@staff$/, user_type: { $ne: null } });

    // Fetch deleted users where user_id ends with @admin, @doctor, or @staff and user_type is null
    const deletedAdmins = await User.find({ user_id: /@admin$/, user_type: null });
    const deletedDoctors = await User.find({ user_id: /@doctor$/, user_type: null });
    const deletedStaff = await User.find({ user_id: /@staff$/, user_type: null });

    // Combine all users into a single object, separating active and deleted users
    const result = {
      admins: {
        active: activeAdmins,
        deleted: deletedAdmins,
      },
      doctors: {
        active: activeDoctors,
        deleted: deletedDoctors,
      },
      staff: {
        active: activeStaff,
        deleted: deletedStaff,
      }
    };

    // Send the result back to the client
    res.status(200).json(result);
  } catch (error) {
    // Handle any errors that occur during the process
    res.status(500).json({ message: 'Error fetching system authorities', error });
  }
};

export const viewPrescriptionList = async (req, res) => {
  try {
    const { user_id, dependent_id } = req.body; 
    let user;
    let prescriptions;

    // Check if we are querying for a dependent or a user
    if (dependent_id) {
      // Find the dependent by ID
      user = await Dependent.findById(dependent_id);
      if (!user) {
        return res.status(404).json({ error: 'Dependent not found' });
      }

      // Find completed prescriptions for the dependent sorted by most recent first
      prescriptions = await Prescription.find({ 
        dep_id: dependent_id, 
        status: 'completed' 
      }).sort({ createdAt: -1 });
      
    } else if (user_id) {
      // Find the user by ID
      user = await User.findOne({ user_id });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Find completed prescriptions for the user sorted by most recent first
      prescriptions = await Prescription.find({ 
        user_id: user._id, 
        status: 'completed' 
      }).sort({ createdAt: -1 });

    } else {
      return res.status(400).json({ error: 'user_id or dependent_id is required' });
    }

    res.status(200).json({
      message: 'Completed prescriptions retrieved successfully',
      prescriptions
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const viewPrescriptionById = async (req, res) => {
  try {    
    const { prescriptionId } = req.body;

   
    const prescription = await Prescription.findById(prescriptionId)
      .populate('user_id') 
      .populate('dep_id')
      .populate('doctor_id');

    
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    
    res.status(200).json({
      message: 'Prescription details fetched successfully',
      prescription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const bulKEntry = async (req, res) => {
  try {
    const myFile = req.file; // Ensure req.file is used
    if (!myFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(myFile.path)
      .pipe(csv())
      .on('data', async (data) => {
        let gender = data.gender === 'F' ? "Female" : "Male";
        
        // Parse date in DD-MM-YYYY format
        const [day, month, year] = data.dob.split('-');
        const date = new Date(`${year}-${month}-${day}`);

        const user = {
          name: data.name,
          DOB: date,
          gender: gender,
          user_id: data.user_id.toLowerCase(),
          user_type: "student",
          contact_no: data.contactno,
          email_id: data.email_id,
          History: {
            relevant: "",
            treatment: ""
          },
          vitals: {
            height: "",
            pulse: 0,
            weight: "",
            body_temp: "",
            bp: "",
            spo2: "",
            bloodgroup: "",
          }
        };

        try {
          const createdUser = await User.create(user);
          results.push(createdUser);
        } catch (error) {
          console.error("Error creating user:", error);
          results.push({ user_id: data.user_id, error: error.message });
        }
      })
      .on('end', () => {
         res.status(200).json({ message: "File processed successfully", data: results });

        // Delete the file after processing
        fs.unlink(myFile.path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully");
          }
        });
      });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

