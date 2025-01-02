const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { checkAuth } = require('../middleware/auth');

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

// Chat Routes
router.get('/history/:userId', checkAuth, async (req, res) => {
    try {
        console.log("User from req:", req.user); 

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }

        const messages = await Message.find({
            $or: [
                { from: req.user._id, to: req.params.userId }, 
                { from: req.params.userId, to: req.user._id } 
            ]
        }).sort({ timestamp: 1 });

        res.json(messages); 
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});
// Update message
router.put('/message/:messageId', checkAuth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { message } = req.body;
        const currentUser = req.user._id;

        const updatedMessage = await Message.findOneAndUpdate(
            { _id: messageId, from: currentUser },
            { 
                message,
                isEdited: true,
                editedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({ error: 'Message not found or unauthorized' });
        }

        res.json(updatedMessage);
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Delete message
router.delete('/message/:messageId', checkAuth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const currentUser = req.user._id;

        const deletedMessage = await Message.findOneAndDelete({
            _id: messageId,
            from: currentUser
        });

        if (!deletedMessage) {
            return res.status(404).json({ error: 'Message not found or unauthorized' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

module.exports = router;