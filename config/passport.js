const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcryptjs');

passport.use(new LocalStrategy({
       usernameField: 'email',
       passwordField: 'password',
   }, async (email, password, done) => {
       try {
           const user = await User.findOne({ email });
           
           if (!user) {
               return done(null, false, { message: 'Invalid email or password' });
           }
   
           if (!user.passwordHash) {
               return done(null, false, { message: 'Password not set' }); // If the password hash doesn't exist
           }
   
           // Ensure password is a string and exists
           if (!password || typeof password !== 'string') {
               return done(null, false, { message: 'Invalid password' });
           }
   
           // Compare the password with the hashed password
           const isMatch = await bcrypt.compare(password, user.passwordHash);
           
           if (!isMatch) {
               return done(null, false, { message: 'Invalid email or password' });
           }
   
           return done(null, user);
       } catch (error) {
           console.error('Error during authentication:', error);
           return done(error);
       }
   }));
   

module.exports = passport;
