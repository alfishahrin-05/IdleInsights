const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    intendedTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IntendedTask',
        required: true
    },
    sessionType: {
        type: String,
        enum: ['active'],
        default: 'active'
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'abandoned'],
        default: 'active'
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    // Track all events that happen during the session
    events: [{
        type: {
            type: String,
            enum: ['distraction', 'pause', 'resume', 'focus_lost', 'focus_regained', 'check_in_success', 'check_in_missed'],
            required: true
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        },
        // For distraction events
        activityCategory: {
            type: String,
            enum: ['social', 'video', 'gaming', 'browsing', 'messaging', 'other']
        },
        durationMinutes: {
            type: Number,
            min: 0
        },
        activityDetail: {
            type: String,
            trim: true
        },
        // For focus tracking events
        awayDurationMinutes: {
            type: Number,
            min: 0
        },
        userClassification: {
            type: String,
            enum: ['distraction', 'working_elsewhere', 'ignored']
        }
    }],
    // Computed summary (calculated when session ends)
    summary: {
        totalMinutes: {
            type: Number,
            default: 0
        },
        focusedMinutes: {
            type: Number,
            default: 0
        },
        distractedMinutes: {
            type: Number,
            default: 0
        },
        pausedMinutes: {
            type: Number,
            default: 0
        },
        distractionCount: {
            type: Number,
            default: 0
        },
        focusLossCount: {
            type: Number,
            default: 0
        },
        checkInsCompleted: {
            type: Number,
            default: 0
        },
        checkInsMissed: {
            type: Number,
            default: 0
        },
        checkInCompletionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        efficiencyScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ userId: 1, status: 1 });

// Method to compute summary when session ends
sessionSchema.methods.computeSummary = function() {
    const session = this;
    
    if (!session.endTime) {
        session.endTime = new Date();
    }
    
    const totalMinutes = Math.round((session.endTime - session.startTime) / 1000 / 60);
    
    let distractedMinutes = 0;
    let pausedMinutes = 0;
    let distractionCount = 0;
    let focusLossCount = 0;
    let checkInsCompleted = 0;
    let checkInsMissed = 0;
    
    let lastPauseTime = null;
    
    // Calculate from events
    session.events.forEach(event => {
        if (event.type === 'distraction') {
            distractedMinutes += event.durationMinutes || 0;
            distractionCount++;
        } else if (event.type === 'focus_lost') {
            focusLossCount++;
        } else if (event.type === 'focus_regained') {
            if (event.userClassification === 'distraction' && event.awayDurationMinutes) {
                distractedMinutes += event.awayDurationMinutes;
            }
        } else if (event.type === 'check_in_success') {
            checkInsCompleted++;
        } else if (event.type === 'check_in_missed') {
            checkInsMissed++;
        } else if (event.type === 'pause') {
            lastPauseTime = event.timestamp;
        } else if (event.type === 'resume' && lastPauseTime) {
            pausedMinutes += Math.round((event.timestamp - lastPauseTime) / 1000 / 60);
            lastPauseTime = null;
        }
    });
    
    // If still paused at end, count that time
    if (lastPauseTime && session.endTime) {
        pausedMinutes += Math.round((session.endTime - lastPauseTime) / 1000 / 60);
    }
    
    const focusedMinutes = Math.max(0, totalMinutes - distractedMinutes - pausedMinutes);
    const efficiencyScore = totalMinutes > 0 
        ? Math.round((focusedMinutes / totalMinutes) * 100) 
        : 0;
    
    const totalCheckIns = checkInsCompleted + checkInsMissed;
    const checkInCompletionRate = totalCheckIns > 0
        ? Math.round((checkInsCompleted / totalCheckIns) * 100)
        : 0;
    
    session.summary = {
        totalMinutes,
        focusedMinutes,
        distractedMinutes,
        pausedMinutes,
        distractionCount,
        focusLossCount,
        checkInsCompleted,
        checkInsMissed,
        checkInCompletionRate,
        efficiencyScore
    };
    
    return session.summary;
};

module.exports = mongoose.model('Session', sessionSchema);
