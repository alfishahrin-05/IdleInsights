const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    intendedTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IntendedTask',
        required: true
    },
    durationMinutes: {
        type: Number,
        required: true,
        min: 1
    },
    activityCategory: {
        type: String,
        enum: ['social', 'video', 'gaming', 'browsing', 'messaging', 'other'],
        required: true
    },
    activityDetail: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for analytics performance
logEntrySchema.index({ userId: 1, createdAt: -1 });
logEntrySchema.index({ userId: 1, activityCategory: 1 });

module.exports = mongoose.model('LogEntry', logEntrySchema);
