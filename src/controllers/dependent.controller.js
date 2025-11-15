import  User  from '../../models/user.model.js';
import  Dependent  from '../../models/dependent.model.js';
import moment from 'moment';

export const addDependent = async (req, res) => {
  try {
    const { user_id } = req.params; // Assuming userId is passed as a parameter
    const { name, DOB, gender, relation, marital_status, contact_no, prescriptions, vitals, email_id } = req.body;

    // Create a new dependent
    const newDependent = new Dependent({
      name,
      user_id: user_id,
      DOB,
      gender,
      relation,
      marital_status,
      prescriptions,
      vitals,
      contact_no,
      email_id,
    });

    // Save the dependent to the database
    await newDependent.save();
    console.log(newDependent)

    // Add dependent to the user's dependents array
    await User.updateOne(
      { _id: user_id },
      { $addToSet: { dependents: newDependent._id } }
  );
  return res
          .status(201)
          .json({ success: true, message: "Dependent added successfully" , dependent: newDependent});
  } catch (error) {
    console.error('Error adding dependent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add dependent',
      error: error.message
    });
  }
};

// Controller to fetch all employees and populate their dependents
export const getAllEmployeesWithDependents = async (req, res) => {
  try {
    // Fetch all users with user_type as 'employee'
    const employees = await User.find({ user_type: 'employee' })
      .populate({
        path: 'dependents',
        select: 'relation gender marital_status DOB authorised name' // Include the authorised field
      });
      
    const results = await Promise.all(
      employees.map(async (employee) => {

        const unauthorized = [];
        const authorized = [];         
        // Process each dependent for the employee
        const updatedDependents = await Promise.all(
          employee.dependents.map(async (dependent) => {
            const age = moment().diff(moment(dependent.DOB), 'years'); // Calculate age from DOB
            const { relation, gender, marital_status } = dependent;
            // Check for unauthorized conditions
            if(relation === 'child'){

              if ((gender === 'female' && marital_status) || (gender === 'male' && age > 25)) {
                unauthorized.push({
                  ...dependent.toObject(),
                  age
                });
              
                // Update authorised field to false in the DB for unauthorized dependents
                if (dependent.authorised !== false ){
                  await Dependent.findByIdAndUpdate(dependent._id, { authorised: false });
                }
              }else {
                authorized.push({
                  ...dependent.toObject(),
                  age
                });
  
                // Update authorised field to true in the DB for authorized dependents
                if (dependent.authorised !== true ) {
                  await Dependent.findByIdAndUpdate(dependent._id, { authorised: true });
                }
              }
          }
            else {
              authorized.push({
                ...dependent.toObject(),
                age
              });

              // Update authorised field to true in the DB for authorized dependents
              if (dependent.authorised !== true ) {
                await Dependent.findByIdAndUpdate(dependent._id, { authorised: true });
              }
            }

            return dependent; // Return dependent after processing
          })
        );
       
        return {
          employee_id: employee.user_id,
          employee_name: employee.name,
          dependents: authorized,
          unauthorized_dependents: unauthorized
        };
      })
    );
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching employees with dependents:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
};