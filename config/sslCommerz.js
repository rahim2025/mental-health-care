const SSLCommerz = require('sslcommerz-lts');

const initiatePayment = async (paymentData) => {
    const storeId = process.env.STORE_ID;
    const storePassword = process.env.STORE_PWD;
    const isLive = false;

    const sslcz = new SSLCommerz(storeId, storePassword, isLive);
    const paymentDetails = {
        total_amount: paymentData.amount,
        currency: paymentData.currency,
        tran_id: paymentData.transactionId, // Must be unique
        success_url: 'http://localhost:8080/payment/success', // Adjust to your endpoint
        fail_url: 'http://localhost:8080/payment/fail',
        cancel_url: 'http://localhost:8080/payment/cancel',
        ipn_url: 'http://localhost:8080/payment/ipn', // Instant payment notification
        cus_name: paymentData.customerName,
        cus_email: paymentData.customerEmail,
        cus_phone: paymentData.customerPhone,
        product_profile: 'general',
    };

    try {
        const response = await sslcz.init(paymentDetails);
        if (!response.GatewayPageURL) {
            throw new Error('Payment gateway URL missing');
        }
        return response.GatewayPageURL; // Return the payment gateway URL
    } catch (error) {
        console.error('Payment initiation failed:', error);
        throw new Error('Payment initiation failed: ' + error.message);
    }
};
console.log('SSLCommerz API Response:', response);
module.exports = initiatePayment;
