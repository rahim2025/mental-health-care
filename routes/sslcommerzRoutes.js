const express = require('express');
const router = express.Router();
const { generateInvoice } = require('../controllers/paymentController');
const SSLCommerzPayment = require('sslcommerz-lts');
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PWD;
const is_live = false; // true for live, false for sandbox

// SSLCommerz initialization
router.get('/init', (req, res) => {
    const data = {
        total_amount: 100,
        currency: 'BDT',
        tran_id: `REF${Date.now()}`,
        success_url: 'http://localhost:8080/payment/success',
        fail_url: 'http://localhost:8080/fail',
        cancel_url: 'http://localhost:8080/cancel',
        ipn_url: 'http://localhost:8080/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    sslcz.init(data).then(apiResponse => {
        const GatewayPageURL = apiResponse.GatewayPageURL;
        if (GatewayPageURL) {
            res.redirect(GatewayPageURL);
        } else {
            res.status(500).json({ status: 'error', message: 'Payment gateway URL missing' });
        }
    }).catch(error => {
        console.error('Error initiating payment:', error);
        res.status(500).json({ status: 'error', message: error.message });
    });
});

// Success, failure, cancel, and IPN handlers
router.post('/success', (req, res) => {
    console.log('Payment Success:', req.body);
    res.render('success', { data: req.body });
});

router.post('/fail', (req, res) => {
    console.error('Payment Failed:', req.body);
    res.render('paymentData', { status: 'fail', data: req.body });
});

router.post('/cancel', (req, res) => {
    console.warn('Payment Cancelled:', req.body);
    res.render('paymentData', { status: 'cancelled', data: req.body });
});

router.post('/ipn', (req, res) => {
    console.log('IPN Received:', req.body);
    res.json({ status: 'ipn_received', data: req.body });
});

// Invoice generation route
router.post('/generate-invoice', generateInvoice);

module.exports = router;
