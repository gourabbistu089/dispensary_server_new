import mongoose from 'mongoose';
const { Schema } = mongoose;

const DependentSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  DOB: {
    type: Date,
    required: true
  },
  relation: {
    type: String,
    enum: ['spouse', 'child', 'parent'],
    required: true
  },
  marital_status: {
    type: Boolean,
    required: true
  },
  prescriptions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Prescription'
    }
  ],
  History:{
    relevant: {type: String,required: false},
    treatment: {type: String,required: false},
},
  vitals: {
    height: Number,
    weight: Number,
    body_temp: Number,
    bp: String,
    spo2: Number,
    pulse: Number,
    bloodgroup:String,
    RandomBloodSugar: String,
  },
  purpose: {
    type: String
  },
  gender: {
    type: String,
    required: true
  },
  contact_no: {
    type: String
  },
  email_id:{
    type: String
  },
  authorised:{
    type: Boolean
  },
});



const Dependent = mongoose.model('Dependent', DependentSchema);

export default Dependent;
