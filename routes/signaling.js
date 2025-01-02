const express = require('express');
const router = express.Router();

// Test route to verify signaling server is up
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Signaling server is running' });
});

module.exports = router;
