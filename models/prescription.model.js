import mongoose from 'mongoose';
import { type } from 'os';
const { Schema } = mongoose;


const SaltIngredient = new Schema({
    name: {
        type: String,
        required: true
    }
})

const keyVal = new Schema({
    key: {
        type: String,
     },
    value: {
        type: String,
    }
});


const MedicineSchema = new Schema({
    // medicine_id: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Medicine',
    //     required: false
    // },
     M_name: {
        type: String,
        required: true
    },

    quantity: keyVal,
    mis: keyVal,
    status: {
        type: String,
        enum: ['deducted', 'pending'],
        default: 'pending'
    },
    dailydose: {
        type: String,
        required: true
    },
    days: {
        type: Number,
        required: true
    },
    timings: {
        type: String
    },
    period: { type: [String]
    },
    type: {
        type: String,
        enum: ['tablet', 'capsule', 'injection', 'syrup', 'suspension', 'gel', 'gargle', 'syringe','cream','lotion','ointment','powder', 'drop','miscellaneous'],
        default: 'tablet'
    },
    remarks: {
        type: 'string',
        required: false
    },
    inInventory: {
        type: Boolean,
        default: true,
    }

});

const PrescriptionSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    dep_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dependent',
        required: false
    },
    doctor_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    purpose: {
        type: String
    },
    presentComplaints: {
        type: String
    },
    provisionalDiagnosis: {
        type: String
    },
    opd: {
        type: String,
        enum: ['opd1', 'opd2', 'opd3'],
        required: false
    },
    clinical_finding: {
        type: String
    },
    investigation: {
        type: String
    },
    medicine: [MedicineSchema],
    remarks: {
        type: String
    },
    other: [MedicineSchema],
    status: {
        type: String,
        enum: ['pending', 'inprogress', 'completed' , 'edit'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Prescription = mongoose.model('Prescription', PrescriptionSchema);

export default Prescription;
