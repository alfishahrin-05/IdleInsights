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

router.get('/active', getActiveSession);

router.get('/history', getSessionHistory);

// Get specific session
router.get('/:id', getSessionById);

router.patch('/:id/pause', pauseSession);

router.patch('/:id/resume', resumeSession);

router.post('/:id/distraction', logDistraction);

router.post('/:id/focus-lost', logFocusLost);

router.post('/:id/focus-regained', logFocusRegained);

router.post('/:id/check-in', logCheckIn);

router.post('/:id/end', endSession);

module.exports = router;
