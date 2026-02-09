const User = require('../models/User');
const LogEntry = require('../models/LogEntry');

// Configuration
const LOG_WINDOW_DAYS = 14;
const PVI_CONSTANT_K = 500;

const recomputeUserAnalytics = async (userId) => {
    try {
        // 1. Fetch logs from last 14 days
        const windowStart = new Date(Date.now() - LOG_WINDOW_DAYS * 24 * 60 * 60 * 1000);

        const logs = await LogEntry.find({
            userId,
            createdAt: { $gte: windowStart }
        }).populate('intendedTaskId');

        // 2. Compute raw PVI
        let rawPvi = 0;

        // For root cause analysis
        const activityCounts = {};
        const taskDifficulties = [];
        const timestamps = [];
        let previousCategory = null;
        let contextSwitches = 0;

        // Helper to init counts
        const cats = ['social', 'video', 'gaming', 'browsing', 'messaging', 'other'];
        cats.forEach(c => activityCounts[c] = 0);

        for (const log of logs) {
            if (!log.intendedTaskId) continue; // Skip if task was deleted (edge case)

            // PVI Impact
            const impact = log.durationMinutes * log.intendedTaskId.difficulty;
            rawPvi += impact;

            // Stats for Root Cause
            activityCounts[log.activityCategory] = (activityCounts[log.activityCategory] || 0) + 1;
            taskDifficulties.push(log.intendedTaskId.difficulty);
            timestamps.push(log.createdAt);

            if (previousCategory && log.activityCategory !== previousCategory) {
                contextSwitches++;
            }
            previousCategory = log.activityCategory;
        }

        // 3. Normalize to 0-100
        // Formula: 100 * (1 - e^(-raw / K))
        const pvi = Math.round(100 * (1 - Math.exp(-rawPvi / PVI_CONSTANT_K)));

        // 4. Determine Root Cause
        const rootCauseLabel = determineRootCause({
            logsCount: logs.length,
            activityCounts,
            taskDifficulties,
            contextSwitches
        });

        // 5. Update user
        await User.updateOne(
            { _id: userId },
            {
                pvi,
                rawPvi,
                rootCauseLabel,
                pviUpdatedAt: new Date()
            }
        );

        return { pvi, rootCauseLabel };

    } catch (error) {
        console.error('Analytics Recomputation Error:', error);
        throw error;
    }
};

const determineRootCause = (data) => {
    const { logsCount, activityCounts, taskDifficulties, contextSwitches } = data;

    if (logsCount < 3) return 'UNCLEAR_NEXT_STEP'; // Not enough data

    const totalLogs = logsCount;

    // Percentages
    const getPct = (category) => (activityCounts[category] || 0) / totalLogs;

    const socialPct = getPct('social');
    const videoPct = getPct('video');
    const browsingPct = getPct('browsing');
    const passivePct = socialPct + videoPct + browsingPct;

    const avgDifficulty = taskDifficulties.reduce((a, b) => a + b, 0) / totalLogs;

    // Rules

    // 1. OVERWHELM_AVOIDANCE: High difficulty + passive consumption
    if (avgDifficulty >= 3.5 && (socialPct + videoPct) > 0.6) {
        return 'OVERWHELM_AVOIDANCE';
    }

    // 2. DOOMSCROLL_LOOP: Pure passive consumption irrespective of task
    if (passivePct > 0.7) {
        return 'DOOMSCROLL_LOOP';
    }

    // 3. CONTEXT_SWITCHING: High switching
    if (contextSwitches / totalLogs > 0.6) {
        return 'CONTEXT_SWITCHING';
    }

    // 4. BOREDOM_ESCAPE: (Simplified proxy) Low avg difficulty + gaming/browsing
    if (avgDifficulty < 2.5 && (getPct('gaming') + browsingPct) > 0.5) {
        return 'BOREDOM_ESCAPE';
    }

    // 5. PERFECTIONISM_DELAY: Often associated with "researching" (browsing/other) on hard tasks
    // This is hard to detect without 'detail', using difficulty proxy
    if (avgDifficulty > 4 && browsingPct > 0.5) {
        return 'PERFECTIONISM_DELAY';
    }

    return 'UNCLEAR_NEXT_STEP';
};

module.exports = {
    recomputeUserAnalytics
};
