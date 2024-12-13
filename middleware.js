// Middleware for checking if the user is authenticated and is a student
function isStudentAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'student') {
        return next();
    }

    req.flash('message', { type: 'error', content: 'Please sign-in to access the student portal.' });
    res.redirect('/portal/sign-in');
}

// Middleware for checking if the user is authenticated (generic)
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('message', { type: 'error', content: 'Please sign-in to access this feature.'});
    res.redirect('/auth');
};

// Export both middlewares in a single object
module.exports = {
    isStudentAuthenticated,
    isAuthenticated,
};
