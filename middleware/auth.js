const jwt = require('jsonwebtoken');
const User = require('../models/users');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.redirect('/auth/login'); 
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            res.clearCookie('token');
            return res.redirect('/auth/login'); 
        }

        req.user = user;
        res.locals.user = user; 
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.clearCookie('token');
        res.redirect('/auth/login'); 
    }
};

// Middleware to check auth status on all routes
exports.checkAuth = async (req, res, next) => {
    try {
        if (req.cookies.token) {
            const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
                res.locals.user = user; 
            }
        }
        next(); 
    } catch (error) {
        // Handle the error (log it or take other actions)
        console.error('Error checking auth status:', error); 
        // You might want to clear the cookie here as well if there's an error
        // res.clearCookie('token');

        req.user = null; 
        res.locals.user = null;
        next(); 
    }
};
