const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logout } = require('../controllers/authController');

// Auth Routes - Render pages
router.get('/login', async (req, res) => {
    try {
        res.render('login', { error: null });
    } catch (error) {
        console.error('Login page error:', error);
        res.status(500).render('login', { error: 'Server error occurred' });
    }
});

router.get('/register', async (req, res) => {
    try {
        res.render('register', { error: null });
    } catch (error) {
        console.error('Register page error:', error);
        res.status(500).render('register', { error: 'Server error occurred' });
    }
});

// Auth Routes - Handle form submissions
router.post('/register', async (req, res) => {
    try {
        await registerUser(req, res);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).render('register', { error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        await loginUser(req, res);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', { error: 'Login failed' });
    }
});

router.get('/logout', (req, res) => {
    try {
        logout(req, res);
    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/');
    }
});

module.exports = router;