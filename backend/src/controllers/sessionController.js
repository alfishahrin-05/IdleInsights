const Session = require('../models/Session');
const IntendedTask = require('../models/IntendedTask');
const LogEntry = require('../models/LogEntry');
const analyticsService = require('../services/analyticsService');

// @desc    Start a new session
// @route   POST /api/sessions/start
// @access  Private
const startSession = async (req, res) => {
    try {
        const { intendedTaskId } = req.body;

        if (!intendedTaskId) {
            return res.status(400).json({ message: 'Task ID is required' });
        }

        // Verify task exists and belongs to user
        const task = await IntendedTask.findOne({
            _id: intendedTaskId,
            userId: req.user._id
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user already has an active session
        const existingSession = await Session.findOne({
            userId: req.user._id,
            status: { $in: ['active', 'paused'] }
        });

        if (existingSession) {
            return res.status(400).json({ 
                message: 'You already have an active session. Please end it first.',
                existingSession 
            });
        }

        // Create new session
        const session = await Session.create({
            userId: req.user._id,
            intendedTaskId,
            startTime: new Date(),
            status: 'active'
        });

        const populatedSession = await Session.findById(session._id)
            .populate('intendedTaskId', 'title difficulty');

        res.status(201).json(populatedSession);

    } catch (error) {
        console.error('Start Session Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Pause active session
// @route   PATCH /api/sessions/:id/pause
// @access  Private
const pauseSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ message: 'Session is not active' });
        }

        session.status = 'paused';
        session.events.push({
            type: 'pause',
            timestamp: new Date()
        });

        await session.save();

        res.json(session);

    } catch (error) {
        console.error('Pause Session Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Resume paused session
// @route   PATCH /api/sessions/:id/resume
// @access  Private
const resumeSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.status !== 'paused') {
            return res.status(400).json({ message: 'Session is not paused' });
        }

        session.status = 'active';
        session.events.push({
            type: 'resume',
            timestamp: new Date()
        });

        await session.save();

        res.json(session);

    } catch (error) {
        console.error('Resume Session Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log a distraction event
// @route   POST /api/sessions/:id/distraction
// @access  Private
const logDistraction = async (req, res) => {
    try {
        const { activityCategory, durationMinutes, activityDetail } = req.body;

        if (!activityCategory || !durationMinutes) {
            return res.status(400).json({ message: 'Activity category and duration are required' });
        }

        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        session.events.push({
            type: 'distraction',
            timestamp: new Date(),
            activityCategory,
            durationMinutes,
            activityDetail
        });

        await session.save();

        res.json(session);

    } catch (error) {
        console.error('Log Distraction Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log focus lost event
// @route   POST /api/sessions/:id/focus-lost
// @access  Private
const logFocusLost = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        session.events.push({
            type: 'focus_lost',
            timestamp: new Date()
        });

        await session.save();

        res.json(session);

    } catch (error) {
        console.error('Log Focus Lost Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log focus regained event
// @route   POST /api/sessions/:id/focus-regained
// @access  Private
const logFocusRegained = async (req, res) => {
    try {
        const { awayDurationMinutes, userClassification } = req.body;

        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        session.events.push({
            type: 'focus_regained',
            timestamp: new Date(),
            awayDurationMinutes,
            userClassification
        });

        await session.save();

        res.json(session);

    } catch (error) {
        console.error('Log Focus Regained Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log check-in event
// @route   POST /api/sessions/:id/check-in
// @access  Private
const logCheckIn = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['success', 'missed'].includes(status)) {
            return res.status(400).json({ message: 'Status must be "success" or "missed"' });
        }

        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        session.events.push({
            type: status === 'success' ? 'check_in_success' : 'check_in_missed',
            timestamp: new Date()
        });

        await session.save();

        res.json(session);

    } catch (error) {
        console.error('Log Check-In Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    End session
// @route   POST /api/sessions/:id/end
// @access  Private
const endSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('intendedTaskId', 'title difficulty');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.status === 'completed' || session.status === 'abandoned') {
            return res.status(400).json({ message: 'Session already ended' });
        }

        session.status = 'completed';
        session.endTime = new Date();
        
        // Compute summary
        session.computeSummary();
        
        await session.save();

        // Convert distraction events to LogEntry documents for analytics
        const distractionEvents = session.events.filter(e => e.type === 'distraction');
        
        for (const distraction of distractionEvents) {
            try {
                await LogEntry.create({
                    userId: req.user._id,
                    intendedTaskId: session.intendedTaskId,
                    activityCategory: distraction.activityCategory || 'other',
                    durationMinutes: distraction.durationMinutes || 0,
                    activityDetail: distraction.activityDetail || `From session: ${session.intendedTaskId.title}`,
                    createdAt: distraction.timestamp
                });
            } catch (logError) {
                console.error('Failed to create log entry from distraction:', logError);
                // Continue with other distractions even if one fails
            }
        }

        // Trigger analytics recomputation
        try {
            await analyticsService.recomputeUserAnalytics(req.user._id);
        } catch (analyticsError) {
            console.error('Analytics recomputation error:', analyticsError);
            // Don't fail the request if analytics fails
        }

        res.json(session);

    } catch (error) {
        console.error('End Session Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get active session
// @route   GET /api/sessions/active
// @access  Private
const getActiveSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            userId: req.user._id,
            status: { $in: ['active', 'paused'] }
        }).populate('intendedTaskId', 'title difficulty');

        res.json(session);

    } catch (error) {
        console.error('Get Active Session Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get session history
// @route   GET /api/sessions/history
// @access  Private
const getSessionHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;

        const sessions = await Session.find({
            userId: req.user._id,
            status: { $in: ['completed', 'abandoned'] }
        })
        .populate('intendedTaskId', 'title difficulty')
        .sort({ startTime: -1 })
        .limit(limit)
        .skip(skip);

        const total = await Session.countDocuments({
            userId: req.user._id,
            status: { $in: ['completed', 'abandoned'] }
        });

        res.json({
            sessions,
            total,
            hasMore: skip + sessions.length < total
        });

    } catch (error) {
        console.error('Get Session History Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get specific session details
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('intendedTaskId', 'title difficulty');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json(session);

    } catch (error) {
        console.error('Get Session Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
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
};
