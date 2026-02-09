const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const modeController = require('../controllers/modeController');

// All routes require authentication
router.use(protect);

// Get active mode
router.get('/active', modeController.getActiveMode);

// Activate a new mode
router.post('/activate', modeController.activateMode);

// Update mode settings
router.put('/:id', modeController.updateModeSettings);

// Add sub-task to mode
router.post('/:id/subtasks', modeController.addSubTask);

// Update sub-task
router.patch('/:id/subtasks', modeController.updateSubTask);

// Delete sub-task
router.delete('/:id/subtasks', modeController.deleteSubTask);

// Complete a sub-task
router.post('/:id/complete-subtask', modeController.completeSubTask);

// Save sub-tasks as template
router.post('/:id/save-template', modeController.saveAsTemplate);

// Digital Friction: Record distraction session start
router.post('/:id/distraction-session', modeController.startDistractionSession);

// Digital Friction: Record distraction session end
router.post('/:id/distraction-session/end', modeController.endDistractionSession);

// Digital Friction: Record friction pause
router.post('/:id/friction-pause', modeController.recordFrictionPause);

// Deactivate mode
router.delete('/:id', modeController.deactivateMode);

module.exports = router;
