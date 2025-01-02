const express = require('express');

// Middleware for logging requests (optional)
function requestLogger(req, res, next) {
    console.log(`${req.method} request to ${req.url}`);
    next(); // Pass control to the next middleware/route handler
  }
  
  // Middleware to parse URL-encoded data (from forms)
  function bodyParserMiddleware(app) {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json()); // For parsing JSON data
  }
  
  // Middleware for validation (checks if name and email are provided)
  function validateFormData(req, res, next) {
    const { name, email } = req.body;
  
    if (!name || !email) {
      return res.status(400).send('Name and Email are required');
    }
  
    next(); // Pass control to the next middleware or route handler
  }
  
  // Error handling middleware (to handle errors and send appropriate response)
  function errorHandler(err, req, res, next) {
    console.error(err); // Log the error for debugging
    res.status(500).send('Something went wrong!'); // Send a generic error message to the client
  }
  
  module.exports = {
    requestLogger,
    bodyParserMiddleware,
    validateFormData,
    errorHandler
  };
  