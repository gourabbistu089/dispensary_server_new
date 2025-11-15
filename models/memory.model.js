import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['othermedicine', 'advice'],
        required: true
    }
}, {
    timestamps: true
});

const Memory = mongoose.model('Memory', memorySchema);

export default Memory;