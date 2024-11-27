const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');

// Get Bookings Page
router.get('/bookings', async (req, res) => {
       if (!req.isAuthenticated()) {
           req.flash('error', 'Please log in to access your bookings.');
           return res.redirect('/auth');
       }
       try {
           const bookings = await Booking.find({ userId: req.user._id });
   
           res.render('bookings', {
               bookings,
               user: req.user,
               messages: req.flash()
           });
       } catch (err) {
           console.error('Error fetching bookings:', err);
           req.flash('error', 'Error fetching your bookings.');
           res.redirect('/bookings');
       }
   });
   
   

// Add a New Booking
router.post('/bookings', async (req, res) => {
       // Ensure user is authenticated
       if (!req.isAuthenticated()) {
           req.flash('error', 'Unauthorized access. Please log in.');
           return res.redirect('/auth');
       }
   
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
           peopleExpected
       } = req.body;
   
       // Validate required fields
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
           'peopleExpected'
       ];
   
       const missingFields = requiredFields.filter(field => !req.body[field]);
       if (missingFields.length > 0) {
           req.flash(
               'error',
               `Missing required fields: ${missingFields.join(', ')}. Please fill in all mandatory fields.`
           );
           return res.redirect('/bookings');
       }
   
       try {
           // Create and save a new booking
           const newBooking = new Booking({
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
               userId: req.user._id
           });
   
           await newBooking.save();
   
           // Flash success message and redirect
           req.flash('success', 'Booking created successfully.');
           return res.redirect('/bookings');
       } catch (err) {
           console.error('Error creating booking:', err);
   
           // Handle Mongoose validation errors
           if (err.name === 'ValidationError') {
               const errorMessages = Object.values(err.errors).map(error => error.message);
               req.flash('error', `Validation failed: ${errorMessages.join(', ')}`);
               return res.redirect('/bookings');
           }
   
           // Handle MongoDB duplicate key errors
           if (err.code === 11000) {
               req.flash('error', 'Duplicate booking data detected. Please check the fields.');
               return res.redirect('/bookings');
           }
   
           // Handle other errors
           req.flash('error', 'An error occurred while creating the booking. Please try again later.');
           return res.redirect('/bookings');
       }
   });
   


module.exports = router;
