const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const nodemailer = require('nodemailer');
const passport = require('passport');
const Student = require('../models/student');
const Cost = require('../models/cost')
const mongoose = require('mongoose');
const moment = require('moment');
const bcrypt = require('bcrypt')

// Admin Sign-In GET Route
router.get('/auth', (req, res) => {
    const errorMessages = req.flash('error');
    const successMessages = req.flash('success');
    res.render('admin/auth', { errorMessages, successMessages });
});


// Admin Sign-In POST Route
router.post('/auth', (req, res, next) => {
    passport.authenticate('admin-local', (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect('/admin/auth');
        }

        if (!user) {
            req.flash('error', info.message || 'Invalid email or password.');
            return res.redirect('/admin/auth');
        }

        if (!user.isAdmin) {
            req.flash('error', 'Access denied. Admins only.');
            return res.redirect('/admin/auth');
        }

        // Log the admin user in
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                req.flash('error', 'Failed to log in. Please try again.');
                return res.redirect('/admin/auth');
            }

            req.flash('success', 'Welcome, Admin!');
            return res.redirect('/admin/dashboard');
        });
    })(req, res, next);
});

const isAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.isAdmin) {
            return next();
        } else {
            req.flash('error_msg', 'You do not have admin privileges.');
            return res.redirect('/');
        }
    } else {
        req.flash('error_msg', 'You must be logged in to view this page.');
        return res.redirect('/admin/auth');
    }
};

router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        if (!req.user) {
            // Redirect to the admin authentication page if the user is not authenticated
            return res.redirect('/admin/auth');
        }

        // Fetch all bookings from the database
        const bookings = await Booking.find();

        // Calculate the monthly report data (revenue, costs, profit, goal completions)
        let monthlyReport = {
            totalRevenue: 0,
            revenueChange: 0,
            totalCost: 0,
            costChange: 0,
            totalProfit: 0,
            profitChange: 0,
            goalCompletions: 0,
            goalCompletionChange: 0,
        };

        // Fetch total revenue from confirmed bookings
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'confirmed' } },  // Filter confirmed bookings
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        monthlyReport.totalRevenue = totalRevenue[0] ? totalRevenue[0].total : 0;
        
        // Fetch total cost from paid costs
        const totalCost = await Cost.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        monthlyReport.totalCost = totalCost[0] ? totalCost[0].total : 0;

        // Calculate profit (Revenue - Cost)
        monthlyReport.totalProfit = monthlyReport.totalRevenue - monthlyReport.totalCost;

        // Assume previous values for calculation if not available
        const previousRevenue = 0; // Replace with actual previous period revenue if available
        const previousCost = 0; // Replace with actual previous period cost if available
        const previousProfit = 0; // Replace with actual previous period profit if available
        const previousGoalCompletions = 0; // Replace with actual previous goal completions if available

        // Calculate percentage changes
        monthlyReport.revenueChange = calculatePercentageChange(monthlyReport.totalRevenue, previousRevenue);
        monthlyReport.costChange = calculatePercentageChange(monthlyReport.totalCost, previousCost);
        monthlyReport.profitChange = calculatePercentageChange(monthlyReport.totalProfit, previousProfit);
        monthlyReport.goalCompletions = 100; // Set based on your logic
        monthlyReport.goalCompletionChange = calculatePercentageChange(monthlyReport.goalCompletions, previousGoalCompletions);

        // Check if bookings are empty
        if (bookings.length === 0) {
            req.flash('error', 'No bookings found.');
        }

        // Render the admin dashboard and pass necessary data to the view
        res.render('admin/dashboard', { 
            bookings, 
            user: req.user, // Pass user data for admin info
            success: req.flash('success'), // Flash success messages if any
            error: req.flash('error'), // Flash error messages if any
            monthlyReport, // Pass the monthlyReport data
        });
    } catch (err) {
        console.error('Error loading bookings:', err);

        // Flash a general error message and redirect
        req.flash('error', 'An error occurred while loading bookings. Please try again.');
        res.redirect('/admin/dashboard'); // Redirect to the same dashboard page
    }
});

// Define the GET route for stream.ejs
router.get('/stream', isAdmin, (req, res) => {
    const streamData = {
        title: 'Live Stream',
        description: 'Stream all the latest events happening!',
        streams: [
            { id: 1, name: 'Event 1', status: 'active', viewers: 1200 },
            { id: 2, name: 'Event 2', status: 'inactive', viewers: 0 }
        ]
    };

    const stats = {
        bookmarks: 41410,
        bookmarkProgress: 70,
        likes: 12345,
        likeProgress: 80,
        events: 67890,
        eventProgress: 60,
        comments: 23456,
        commentProgress: 50
    };

    // Set the streamStatus based on your conditions or streaming system
    const streamStatus = 'active';  // Example, you can make this dynamic

    // The stream URL could be set based on the stream status
    const streamUrl = streamStatus === 'active' ? 'http://localhost:8080/hls/stream.m3u8' : '';

    res.render('admin/stream', {
        user: req.user,
        streamData: streamData,
        stats: stats,
        streamStatus: streamStatus,
        streamUrl: streamUrl
    });
});


// Function to calculate percentage change
function calculatePercentageChange(current, previous) {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }
    return ((current - previous) / previous) * 100;
}



// Helper function to generate a random alphanumeric string
function generateRandomPassword(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}

async function generateAdmissionNumber() {
    // Generate a random 6-digit number
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const admissionNumber = `MTI-${randomNumber}`;

    const existingStudent = await Student.findOne({ admissionNumber });

    if (existingStudent) {
        return generateAdmissionNumber();
    }

    return admissionNumber;
}

// GET route for fetching students
router.get('/students', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;

        const totalStudents = await Student.countDocuments();
        const totalPages = Math.ceil(totalStudents / limit);

        const students = await Student.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        students.forEach(student => {
            student.formattedCreatedAt = moment(student.createdAt).format('MMMM Do YYYY, h:mm:ss a');
        });

        res.render('admin/students', {
            title: 'Students Page',
            studentsList: students,
            currentPage: page,
            totalPages: totalPages,
            totalStudents: totalStudents,
            message: req.flash('info'),
            errorMessage: req.flash('error'),
        });
    } catch (error) {
        console.error('Error fetching students:', error.message);

        req.flash('error', 'Failed to load students. Please try again later.');
        res.render('admin/students', {
            title: 'Students Page',
            studentsList: [],
            currentPage: 1,
            totalPages: 1,
            totalStudents: 0,
            message: req.flash('info'),
            errorMessage: req.flash('error'),
        });
    }
});

// POST route for creating a new student
router.post('/students', async (req, res) => {
    const { name, email, idNumber, dateOfBirth, nextOfKin, phoneNumber, program, expectedFee, paidFee } = req.body;

    if (!name || !email || !idNumber || !dateOfBirth || !nextOfKin || !phoneNumber || !program || !expectedFee || !paidFee) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/admin/students');
    }

    try {
        const admissionNumber = await generateAdmissionNumber();
        const studentNumber = admissionNumber;
        const password = generateRandomPassword();
        const passwordHash = await bcrypt.hash(password, 10);

        if (!studentNumber) {
            req.flash('error', 'Failed to generate admission number. Please try again.');
            return res.redirect('/admin/students');
        }

        const newStudent = new Student({
            name,
            email,
            passwordHash,
            admissionNumber,
            studentNumber,
            idNumber,
            dateOfBirth,
            nextOfKin,
            phoneNumber,
            program,
            expectedFee,
            paidFee,
        });

        await newStudent.save();

        try {
            await sendWelcomeEmail(name, email, admissionNumber, password);
            req.flash('success', 'Student created successfully, and login details sent via email.');
        } catch (emailError) {
            console.error('Email delivery failed:', emailError.message);
            req.flash('warning', 'Student created, but email delivery failed.');
        }

        res.redirect('/admin/students');
    } catch (error) {
        console.error('Error creating student:', error.message);

        if (error.code === 11000) {
            req.flash('error', 'Duplicate entry: Email or admission number already exists.');
        } else if (error instanceof mongoose.Error.ValidationError) {
            req.flash('error', 'Validation error: Please check the provided data.');
        } else {
            req.flash('error', 'An unexpected error occurred. Please try again.');
        }

        res.redirect('/admin/students');
    }
});

const sendWelcomeEmail = async (name, email, admissionNumber, password) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: '"Macdee Training Institute"<admin@example.com>',
        to: email,
        subject: 'Welcome To Macdee Training Institute!',
        html: `
           <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Institution</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f7f7f7;
            color: #444;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        .email-header {
            background-color: #4a90e2; /* Soft blue */
            color: #ffffff;
            padding: 10px;
            text-align: center;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        .email-header h2 {
            margin: 0;
            font-size: 14px; /* Slightly larger heading for more emphasis */
            font-weight: normal;
        }
        .email-body {
            padding: 15px;
            background-color: #ffffff;
            font-size: 10px;
            line-height: 1.6;
        }
        .email-body p {
            margin-bottom: 10px;
        }
        .email-body ul {
            list-style-type: none;
            padding: 0;
        }
        .email-body li {
            background-color: #f9f9f9;
            padding: 12px;
            border: 1px solid #ddd;
            margin-bottom: 8px;
            border-radius: 4px;
        }
        .email-body li strong {
            color: #333;
        }
        .email-footer {
            background-color: #f1f1f1; /* Light gray */
            color: #666;
            text-align: center;
            padding: 10px;
            font-size: 13px;
            border-top: 1px solid #ddd;
        }
        .email-footer p {
            margin: 0;
        }
        .email-footer a {
            color: #4a90e2; /* Blue for the link */
            text-decoration: none;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <h2><strong>Welcome to Macdee Training Institute, ${name}!</strong></h2>
        </div>

        <!-- Body -->
        <div class="email-body">
            <p>We are thrilled to have you as part of our institution. Below are your Student Portal login credentials:</p>
            <ul>
                <li><strong>Admission Number:</strong> ${admissionNumber}</li>
                <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p>Please log in and change your password for security purposes.</p>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p>If you have any questions, feel free to <a href="mailto:support@institution.com">contact us</a>.</p>
        </div>
    </div>

</body>
</html>



        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Email delivery failed');
    }
};

// Update student details
router.post('/students/edit/:id', async (req, res) => {
    const { id } = req.params;
    const {
        name,
        email,
        idNumber,
        dateOfBirth,
        nextOfKinName,
        nextOfKinContact,
        phoneNumber,
        program,
        expectedFee,
        paidFee,
        enrollmentDate,
    } = req.body;

    try {
        await Student.findByIdAndUpdate(id, {
            name,
            email,
            idNumber,
            dateOfBirth: new Date(dateOfBirth),
            nextOfKin: {
                name: nextOfKinName,
                contact: nextOfKinContact,
            },
            phoneNumber,
            program,
            expectedFee,
            paidFee,
            enrollmentDate: new Date(enrollmentDate),
        });

        res.redirect('/admin/students');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating student information.');
    }
});

// Delete student
router.get('/students/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await Student.findByIdAndDelete(id);

        res.redirect('/admin/students');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting student.');
    }
});


// Start streaming
router.post('/start-stream', (req, res) => {
    // Logic to start streaming (e.g., start OBS or trigger NGINX config)
    exec('systemctl start nginx', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error starting the stream');
        }
        // Update stream status in the database (if applicable)
        res.redirect('/admin/stream');
    });
});

// Stop streaming
router.post('/stop-stream', (req, res) => {
    // Logic to stop streaming (e.g., stop OBS or change NGINX config)
    exec('systemctl stop nginx', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error stopping the stream');
        }
        // Update stream status in the database (if applicable)
        res.redirect('/admin/stream');
    });
});


module.exports = router;
