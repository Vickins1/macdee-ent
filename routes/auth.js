const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

router.get('/auth', (req, res) => {
    const messages = req.flash('message') || [];
    res.render('login', { messages });
});

// Route: POST /auth/signup - Handle user registration
router.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validate input
    if (!username || !email || !password || !confirmPassword) {
        req.flash('message', { type: 'error', content: 'All fields are required.' });
        return res.redirect('/auth');
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        req.flash('message', { type: 'error', content: 'Passwords do not match.' });
        return res.redirect('/auth');
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('message', { type: 'error', content: 'Email is already registered.' });
            return res.redirect('/auth');
        }

        // Create and save new user
        const newUser = new User({ username, email });
        await newUser.setPassword(password);
        await newUser.save();

        req.flash('message', { type: 'success', content: 'Registration successful! Please log in.' });
        res.redirect('/auth');
    } catch (error) {
        console.error('Error during signup:', error);
        req.flash('message', { type: 'error', content: 'An error occurred during registration. Please try again.' });
        res.redirect('/auth');
    }
});

router.post('/login', (req, res, next) => {
       const { email, password } = req.body;
   
       // Validate input: Make sure both email and password are provided
       if (!email || !password) {
           req.flash('message', { type: 'error', content: 'Email and password are required.' });
           return res.redirect('/auth');
       }
   
       passport.authenticate('local', (err, user, info) => {
           if (err) {
               console.error('Error during authentication:', err);
               req.flash('message', { type: 'error', content: 'An error occurred during login. Please try again.' });
               return res.redirect('/auth');
           }
   
           if (!user) {
               req.flash('message', { type: 'error', content: info.message || 'Invalid email or password.' });
               return res.redirect('/auth');
           }
   
           // Log in the user
           req.logIn(user, (err) => {
               if (err) {
                   console.error('Error during login:', err);
                   req.flash('message', { type: 'error', content: 'An error occurred while logging in. Please try again.' });
                   return res.redirect('/auth');
               }
   
               res.redirect('/bookings');
           });
       })(req, res, next);
   });
   

   router.get('/logout', (req, res, next) => {
       req.logout(function (err) {
           if (err) {
               return next(err);
           }
           res.redirect('/');
       });
   });

module.exports = router;
