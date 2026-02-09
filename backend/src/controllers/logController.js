const LogEntry = require('../models/LogEntry');
const IntendedTask = require('../models/IntendedTask');
const User = require('../models/User');
const analyticsService = require('../services/analyticsService');

// @desc    Get logs
// @route   GET /api/logs
// @access  Private
const getLogs = async (req, res) => {
    try {
        const { from, to, category } = req.query;
        const query = { userId: req.userId };

        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        if (category) {
            query.activityCategory = category;
        }

        const logs = await LogEntry.find(query)
            .populate('intendedTaskId', 'title difficulty')
            .sort({ createdAt: -1 });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create log & recompute analytics
// @route   POST /api/logs
// @access  Private
const createLog = async (req, res) => {
    try {
        const { intendedTaskId, durationMinutes, activityCategory, activityDetail } = req.body;

        if (!intendedTaskId || !durationMinutes || !activityCategory) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // Validation
        const task = await IntendedTask.findById(intendedTaskId);
        if (!task) {
            return res.status(404).json({ message: 'Intended Task not found' });
        }
        if (task.userId.toString() !== req.userId) {
            return res.status(401).json({ message: 'Unauthorized access to task' });
        }

        // Create Log
        const logEntry = await LogEntry.create({
            userId: req.userId,
            intendedTaskId,
            durationMinutes,
            activityCategory,
            activityDetail
        });

        // TRIGGER ANALYTICS
        const analyticsResult = await analyticsService.recomputeUserAnalytics(req.userId);

        // Return response with new analytics
        res.status(200).json({
            logEntry,
            analytics: analyticsResult
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update log & recompute
// @route   PUT /api/logs/:id
// @access  Private
const updateLog = async (req, res) => {
    try {
        const log = await LogEntry.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        if (log.userId.toString() !== req.userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedLog = await LogEntry.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        // TRIGGER ANALYTICS
        await analyticsService.recomputeUserAnalytics(req.userId);
        const user = await User.findById(req.userId); // fetch latest

        res.status(200).json({
            logEntry: updatedLog,
            analytics: {
                pvi: user.pvi,
                rootCauseLabel: user.rootCauseLabel
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete log & recompute
// @route   DELETE /api/logs/:id
// @access  Private
const deleteLog = async (req, res) => {
    try {
        const log = await LogEntry.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        if (log.userId.toString() !== req.userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await log.deleteOne();

        // TRIGGER ANALYTICS
        await analyticsService.recomputeUserAnalytics(req.userId);
        const user = await User.findById(req.userId);

        res.status(200).json({
            id: req.params.id,
            analytics: {
                pvi: user.pvi,
                rootCauseLabel: user.rootCauseLabel
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLogs,
    createLog,
    updateLog,
    deleteLog,
};
