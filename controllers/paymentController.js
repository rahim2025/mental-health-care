const SSLCommerzPayment = require('sslcommerz-lts');
const PDFDocument = require('pdfkit');
const Payment = require('../models/payment');
const path = require('path');

exports.initiatePayment = async (req, res) => {
    const { amount, currency, customerName, customerEmail, customerPhone } = req.body;

    if (!amount || !currency || !customerName || !customerEmail) {
        return res.status(400).json({ status: 'error', message: 'Required fields are missing' });
    }

    const data = {
        total_amount: amount,
        currency,
        tran_id: `REF${Date.now()}`, // Generate unique transaction ID
        success_url: 'http://localhost:8080/payment/success',
        fail_url: 'http://localhost:8080/payment/fail',
        cancel_url: 'http://localhost:8080/payment/cancel',
        ipn_url: 'http://localhost:8080/payment/ipn',
        cus_name: customerName,
        cus_email: customerEmail,
        cus_phone: customerPhone,
        product_profile: 'general',
    };

    try {
        const sslcz = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PWD, false);
        const apiResponse = await sslcz.init(data);

        if (apiResponse.GatewayPageURL) {
            return res.redirect(apiResponse.GatewayPageURL);
        } else {
            return res.status(400).json({ status: 'error', message: 'Payment gateway URL missing' });
        }
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ status: 'error', message: 'Payment initiation failed: ' + error.message });
    }
};
exports.generateInvoice = async (req, res) => {
    try {
        const { tran_id, amount, currency, customerName, customerEmail, customerPhone } = req.body;

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set file path
        const fileName = `Invoice-${tran_id}.pdf`;
        const filePath = path.join(__dirname, '../invoices', fileName);

        // Pipe the PDF into a file
        doc.pipe(require('fs').createWriteStream(filePath));

        // Add PDF content
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text(`Transaction ID: ${tran_id}`);
        doc.text(`Customer Name: ${customerName}`);
        doc.text(`Email: ${customerEmail}`);
        doc.text(`Phone: ${customerPhone || 'N/A'}`);
        doc.text(`Amount Paid: ${amount} ${currency}`);
        doc.text(`Date: ${new Date().toLocaleString()}`);

        doc.end();

        // Send the file as a response
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
                res.status(500).send('Error generating invoice');
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating invoice');
    }
};