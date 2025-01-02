const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authenticateJWT = require('../middleware/authMiddleware');

router.get('/add', authenticateJWT, (req, res) => 
    sessionController.renderAddSessionPage(req, res));
  
router.post('/add', authenticateJWT, (req, res) => 
    sessionController.addSessionNote(req, res));

router.get('/list', authenticateJWT, (req, res) => 
  sessionController.renderSessionNotesList(req, res));

router.get('/notes', authenticateJWT, (req, res) => 
  sessionController.getSessionNotes(req, res));

module.exports = router;