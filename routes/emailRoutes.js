// routes/emailRoutes.js (or equivalent)
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Use the transporter setup (same setup from your .env)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Updated route for sending session reminder email
router.post('/sessions/send-session-reminder', (req, res) => {
  const { email, subject, text } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER, // sender address
    to: email,                    // recipient address
    subject: subject,             // Subject line
    text: text,                   // plain text body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Error sending email",
        error: error,
      });
    }
    console.log('Email sent: ' + info.response);
    return res.status(200).send({
      success: true,
      message: "Email sent successfully",
      info: info,
    });
  });
});

module.exports = router;
