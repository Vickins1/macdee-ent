const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const passport = require('./config/passport');
const methodOverride = require('method-override');
const authRoutes = require('./routes/auth');
const User = require('./models/user')
const bodyParser = require('body-parser');
const indexRoutes = require('./routes/index');
dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.serializeUser((user, done) => {
       done(null, user.id);
   });
   
   passport.deserializeUser(async (id, done) => {
       try {
           const user = await User.findById(id);
           done(null, user);
       } catch (err) {
           done(err);
       }
   });
   

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => res.render('index'));
app.use('/', authRoutes);
app.use('/', indexRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
