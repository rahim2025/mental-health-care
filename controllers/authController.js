const User = require('../models/users');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username }
            ]
        });

        if (existingUser) {
            return res.render('register', { 
                error: 'An account with this email or username already exists'
            });
        }

        // Create new user
        const user = await User.create({
            username: username,
            email: email.toLowerCase(),
            password: password
        });

        // Redirect to login after successful registration (no session started here)
        res.redirect('/auth/login'); 

    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { 
            error: 'An error occurred during registration. Please try again.'
        });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and select password field
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Store user in locals for views
        res.locals.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        // Redirect to index page
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login' });
    }
};

exports.logout = (req, res) => {
    try {
        res.clearCookie('token');
        res.redirect('/');
    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/');
    }
}; 

