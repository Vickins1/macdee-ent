const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    admissionNumber: {
        type: String,
        unique: true
    },
    studentNumber: { 
        type: String, 
        unique: true, 
        required: true
     },
    idNumber: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    nextOfKin: {
        name: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        }
    },
    phoneNumber: {
        type: String,
        required: true
    },
    program: {
        type: String,
        required: true
    },
    expectedFee: {
        type: Number,
        required: true
    },
    paidFee: {
        type: Number, 
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Student', studentSchema);
