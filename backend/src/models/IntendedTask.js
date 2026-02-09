const mongoose = require('mongoose');

const intendedTaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    // Template for Task Deconstructor mode
    subTaskTemplate: [{
        text: {
            type: String,
            trim: true
        },
        estimatedMinutes: {
            type: Number,
            min: 0
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('IntendedTask', intendedTaskSchema);
