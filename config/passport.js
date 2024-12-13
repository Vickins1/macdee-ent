const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user'); 
const Student = require('../models/student');
const bcrypt = require('bcrypt');

// Admin Strategy
passport.use('admin-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return done(null, false, { message: 'No user found with that email.' });
        }

        // Check if the password matches
        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            return done(null, false, { message: 'Invalid password.' });
        }

        // Check if the user is an admin
        if (!user.isAdmin) {
            return done(null, false, { message: 'Access denied. Admins only.' });
        }

        return done(null, user);

    } catch (err) {
        return done(err);
    }
}));

// User Strategy
passport.use('user-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false, { message: 'Invalid email!' });

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) return done(null, false, { message: 'Invalid email or password!' });

        return done(null, user);
    } catch (error) {
        console.error(error);
        return done(error);
    }
}));

passport.use('student-local', new LocalStrategy(
    {
        usernameField: 'admissionNumber',
        passwordField: 'password'
    },
    async (admissionNumber, password, done) => {
        try {
            const student = await Student.findOne({ admissionNumber });
            if (!student) {
                return done(null, false, { message: 'Invalid admission number.' });
            }

            const isMatch = await bcrypt.compare(password, student.passwordHash);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid password.' });
            }

            return done(null, student);
        } catch (err) {
            return done(err);
        }
    }
));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, { id: user.id, isAdmin: user.isAdmin });
});

// Deserialize user based on user ID and isAdmin flag
passport.deserializeUser(async ({ id, isAdmin }, done) => {
    try {
        
        let user = null;

        user = await User.findById(id);

        if (!user) return done(null, false);
        done(null, user);
    } catch (error) {
        console.error(error);
        done(error);
    }
});

module.exports = passport;
