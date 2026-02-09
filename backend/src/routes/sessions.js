const express = require('express');
const router = express.Router();
const {
    startSession,
    pauseSession,
    resumeSession,
    logDistraction,
    logFocusLost,
    logFocusRegained,
    logCheckIn,
    endSession,
    getActiveSession,
    getSessionHistory,
    getSessionById
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Start new session
router.post('/start', startSession);

// Get active session
router.get('/active', getActiveSession);

// Get session history
router.get('/history', getSessionHistory);

// Get specific session
router.get('/:id', getSessionById);

// Pause session
router.patch('/:id/pause', pauseSession);

// Resume session
router.patch('/:id/resume', resumeSession);

// Log distraction
router.post('/:id/distraction', logDistraction);

// Log focus lost
router.post('/:id/focus-lost', logFocusLost);

// Log focus regained
router.post('/:id/focus-regained', logFocusRegained);

// Log check-in
router.post('/:id/check-in', logCheckIn);

// End session
router.post('/:id/end', endSession);

module.exports = router;
