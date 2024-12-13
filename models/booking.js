const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    service: { type: String, required: true },
    eventType: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    peopleExpected: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Cancelled'], default: 'Pending' }
});

module.exports = mongoose.model('Booking', bookingSchema);
