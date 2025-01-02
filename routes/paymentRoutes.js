const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/init', paymentController.initiatePayment);

router.post('/success', (req, res) => {
    console.log('Payment Success:', req.body);
    res.json({ 
        status: 'success', 
        message: 'Payment successful!', 
        data: req.body 
    });
});
router.post('/fail', (req, res) => {
    res.json({ status: 'fail', data: req.body });
});

router.post('/cancel', (req, res) => {
    res.json({ status: 'cancelled', data: req.body });
});

router.post('/submitDetails', (req, res) => {
    res.render('submitDetails');
});

router.post('/generate-invoice', paymentController.generateInvoice);

module.exports = router;

