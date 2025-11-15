import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const jwtPrivateKey = crypto.randomBytes(32).toString('hex');
if(process.env.NODE_ENV === 'no'){
    process.env.JWTPRIVATEKEY = "apple";
}
else{
    process.env.JWTPRIVATEKEY = jwtPrivateKey;
}
// console.log("JWTPRIVATEKEY in user model",process.env.JWTPRIVATEKEY)
const otpSchema = new mongoose.Schema({
    value: String,
    expires: {
        type: Date,
        index: { expires: '3m' } // TTL index to remove after 3 minutes
    }
});

const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    DOB: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    user_type: {
        type: String,
        required: true
    },
    contact_no: {
        type: String,
        required: true
    },
    email_id: {
        type: String,
        required: false

    },
    otp: otpSchema, // Subschema with TTL
    isOtpVerified: {
        type: Boolean,
        default: undefined
    },
    dependents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Dependent'
        }
    ],
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
        height: String,
        pulse: Number,
        weight: String,
        body_temp: String,
        bp: String,
        spo2: String,
        bloodgroup: String,
        RandomBloodSugar: String
    },
    remarks: {
        type: String
    }
});

// Middleware to remove otp and isOtpVerified after 3 minutes
userSchema.pre('save', function (next) {
    const user = this;

    if (user.isModified('otp')) { // When the otp field is modified
        setTimeout(() => {
            User.findByIdAndUpdate(user._id, { $unset: { otp: 1, isOtpVerified: 1 } }, { new: true }).exec();
        }, 180000); // 180000ms = 3 minutes
    }

    next();
});


// Add passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose, {
    usernameField: 'user_id'
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env
        .JWTPRIVATEKEY, {
        expiresIn: '7d'
    });
    return token;
};

const User = mongoose.model('User', userSchema);

export default User;
