const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const passport = require('./config/passport');
const methodOverride = require('method-override');
const User = require('./models/user');
const path = require('path');
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const portalRoutes = require('./routes/portal');

dotenv.config();

const app = express();

// Set view engine and views path explicitly
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Session and Passport setup
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

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.info_msg = req.flash('info');
  next();
});


// Passport serialization & deserialization
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

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => res.render('index'));
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/portal', portalRoutes);

// 404 Error handler
app.use((req, res, next) => {
  res.status(404).render('404', { 
      message: "Page not found", 
      user: req.user || {} 
  });
});


// 500 Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { 
      message: "Something went wrong!", 
      user: req.user || {} 
  });
});



const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
