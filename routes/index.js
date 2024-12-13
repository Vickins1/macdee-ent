const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');

router.get('/bookings', (req, res) => {
    const messages = req.flash('message') || [];
    res.render('bookings', { messages });
});

// Create a new booking
router.post('/bookings', async (req, res) => {
    const {
        customerName,
        customerEmail,
        customerPhone,
        service,
        location,
        eventType,
        date,
        time,
        peopleExpected,
        totalPrice,
    } = req.body;

    try {
        const newBooking = new Booking({
            customerName,
            customerPhone,
            customerEmail,
            service,
            location,
            eventType,
            date,
            time,
            peopleExpected,
            totalPrice,
        });

        await newBooking.save();
        req.flash('success', 'Your booking was successful! We will get back to you ASAP.');
        res.redirect('/bookings');
    } catch (error) {
        console.error('Error creating booking:', error);
        req.flash('error', 'An error occurred while processing your booking.');
        res.redirect('/bookings');
    }
});

// Edit an existing booking
router.post('/bookings/edit/:id', async (req, res) => {
    const { id } = req.params;
    const {
        customerName,
        customerEmail,
        phoneNumber,
        service,
        eventType,
        location,
        date,
        time,
        totalPrice,
        peopleExpected,
    } = req.body;

    const requiredFields = [
        'customerName',
        'customerEmail',
        'phoneNumber',
        'service',
        'eventType',
        'location',
        'date',
        'time',
        'totalPrice',
        'peopleExpected',
    ];

    // Check for missing fields
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        req.flash('error', `Missing required fields: ${missingFields.join(', ')}. Please fill in all mandatory fields.`);
        return res.redirect('/bookings');
    }

    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            {
                customerName,
                customerEmail,
                phoneNumber,
                service,
                eventType,
                location,
                date,
                time,
                totalPrice,
                peopleExpected,
                userId: req.user._id, // Ensure the user ID is retained
            },
            { new: true } // Return the updated document
        );

        if (!updatedBooking) {
            req.flash('error', 'Booking not found.');
            return res.redirect('/bookings');
        }

        req.flash('success', 'Booking updated successfully.');
        res.redirect('/bookings');
    } catch (err) {
        console.error('Error updating booking:', err);

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errorMessages = Object.values(err.errors).map((error) => error.message);
            req.flash('error', `Validation failed: ${errorMessages.join(', ')}`);
            return res.redirect(`/bookings/edit/${id}`);
        }

        // Handle MongoDB duplicate key error
        if (err.name === 'MongoError' && err.code === 11000) {
            req.flash('error', 'Duplicate booking data detected. Please check the fields.');
            return res.redirect(`/bookings/edit/${id}`);
        }

        req.flash('error', 'An error occurred while updating the booking. Please try again later.');
        res.redirect(`/bookings/edit/${id}`);
    }
});

// Cancel Booking Route
router.post('/bookings/cancel/:id', async (req, res) => {
       try {
           const bookingId = req.params.id;
   
           // Update the booking status to 'Cancelled'
           await Booking.findByIdAndUpdate(bookingId, { status: 'Cancelled' });
   
           req.flash('success', 'Booking canceled successfully.');
           res.redirect('/bookings');
       } catch (error) {
           req.flash('error', 'Failed to cancel the booking.');
           res.redirect('/bookings');
       }
   });


   router.get('/live', (req, res) => {
    // Example: Check if the stream is live or inactive
    const streamStatus = 'active'; // You would fetch this from the stream service or database
    const streamUrl = 'http://localhost:8080/hls/stream.m3u8'; // Your live stream URL
    const streamTitle = 'Event Name or Stream Title'; // Provide a relevant stream title

    res.render('live', {
        streamStatus: streamStatus,
        streamUrl: streamUrl,
        streamTitle: streamTitle
    });
});


module.exports = router;
