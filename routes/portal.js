const express = require('express');
const router = express.Router();
const passport = require('passport')

// Route: GET /portal/sign-in - Login page
router.get('/sign-in', (req, res) => {
    const messages = req.flash('message') || [];
    res.render('portal/login', { messages });
});

// Route: POST /portal/sign-in - Handle student login
router.post('/sign-in', (req, res, next) => {
    passport.authenticate('student-local', (err, user, info) => {
        if (err) {
            req.flash('message', { type: 'error', content: 'An error occurred. Please try again.' });
            return res.redirect('/portal/sign-in');
        }

        if (!user) {
            req.flash('message', { type: 'error', content: info?.message || 'Invalid admission number or password.' });
            return res.redirect('/portal/sign-in');
        }

        req.logIn(user, (loginErr) => {
            if (loginErr) {
                req.flash('message', { type: 'error', content: 'Login failed. Please try again.' });
                return res.redirect('/portal/sign-in');
            }

            req.session.save((sessionErr) => {
                if (sessionErr) {
                    req.flash('message', { type: 'error', content: 'Session error occurred. Please try again.' });
                    return res.redirect('/portal/sign-in');
                }

                req.flash('message', { type: 'success', content: 'Login successful! Welcome to the dashboard.' });
                return res.redirect('/portal/dashboard');
            });
        });
    })(req, res, next);
});

// Middleware: Ensure user is authenticated and is a student
const isStudent = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('message', { type: 'error', content: 'You must be logged in to view this page.' });
        return res.redirect('/portal/sign-in');
    }
    if (req.user.isStudent) {
        return next();
    } else {
        req.flash('message', { type: 'error', content: 'Access denied. Students only.' });
        return res.redirect('/');
    }
};


// Route: GET /portal/dashboard - Render dashboard page
router.get('/dashboard', isStudent, (req, res) => {
    res.render('portal/dashboard', {
        student: req.user,
        messages: req.flash('message'),
    });
});

// Profile Route
router.get('/profile', (req, res) => {
    res.render('portal/profile', {
        user: req.user
    });
});

// Logout Route
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
