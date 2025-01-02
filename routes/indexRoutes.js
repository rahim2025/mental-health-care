const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Import the auth middleware

router.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

router.get('/phone-support', (req, res) => {
  res.render('phone-support', { user: req.user });
});

router.get('/premium-packs', (req, res) => {
  res.render('premium-packs');
});

router.get('/paymentData', (req, res) => {
  // Simulate some test data (Replace with real data from your database or request)
  const testData = {
    customerName: 'John Doe',
    customerEmail: 'johndoe@example.com',
    customerPhone: '123456789',
    amount: '500',
    currency: 'BDT',
  };

  res.render('paymentData', { data: testData });
});

// Add new chat route
router.get('/chat', protect, (req, res) => {  // protect middleware ensures only logged-in users can access
  res.render('chat', { user: req.user });
});

module.exports = router;
