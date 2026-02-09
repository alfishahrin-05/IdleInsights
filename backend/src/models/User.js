const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    // Analytics
    pvi: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    rawPvi: {
        type: Number,
        default: 0
    },
    rootCauseLabel: {
        type: String,
        enum: [
            'OVERWHELM_AVOIDANCE',
            'DOOMSCROLL_LOOP',
            'PERFECTIONISM_DELAY',
            'BOREDOM_ESCAPE',
            'CONTEXT_SWITCHING',
            'UNCLEAR_NEXT_STEP',
            null
        ],
        default: null
    },
    pviUpdatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Pre-save hook removed

module.exports = mongoose.model('User', userSchema);
