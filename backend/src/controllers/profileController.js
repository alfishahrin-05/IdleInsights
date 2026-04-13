const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update user profile (text fields)
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio } = req.body;
    
    // Validate input
    if (firstName && firstName.trim().length > 50) {
      return res.status(400).json({ message: 'First name must be less than 50 characters' });
    }
    if (lastName && lastName.trim().length > 50) {
      return res.status(400).json({ message: 'Last name must be less than 50 characters' });
    }
    if (bio && bio.trim().length > 500) {
      return res.status(400).json({ message: 'Bio must be less than 500 characters' });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get current user to delete old profile picture
    const user = await User.findById(req.user._id);
    
    // Delete old profile picture if it exists
    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save new profile picture path
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: profilePicturePath },
      { new: true }
    ).select('-passwordHash');

    res.json({ 
      message: 'Profile picture uploaded successfully', 
      user: updatedUser,
      profilePicture: profilePicturePath
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.profilePicture) {
      return res.status(400).json({ message: 'No profile picture to delete' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profilePicture));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete reference from database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: null },
      { new: true }
    ).select('-passwordHash');

    res.json({ message: 'Profile picture deleted successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting profile picture', error: error.message });
  }
};
