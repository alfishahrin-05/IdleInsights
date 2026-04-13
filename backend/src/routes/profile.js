const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const profileController = require('../controllers/profileController');

// All routes require authentication
router.use(protect);

// Get user profile
router.get('/', profileController.getProfile);

// Update user profile (text fields)
router.put('/', profileController.updateProfile);

// Upload profile picture
router.post('/upload-picture', upload.single('profilePicture'), profileController.uploadProfilePicture);

// Delete profile picture
router.delete('/picture', profileController.deleteProfilePicture);

module.exports = router;
