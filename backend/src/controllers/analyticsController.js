const LogEntry = require('../models/LogEntry');
const User = require('../models/User');

// @desc    Get analytics summary (PVI, Root Cause, Stats)
// @route   GET /api/analytics/summary
// @access  Private
const getAnalyticsSummary = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('pvi rootCauseLabel');

        // Calculate simple stats
        const logs = await LogEntry.find({ userId: req.userId });

        const totalMinutes = logs.reduce((acc, log) => acc + log.durationMinutes, 0);
        const avgSession = logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0;

        // Simple top category
        const counts = {};
        logs.forEach(l => counts[l.activityCategory] = (counts[l.activityCategory] || 0) + 1);
        const topActivity = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

        res.status(200).json({
            pvi: user.pvi,
            rootCauseLabel: user.rootCauseLabel,
            stats: {
                totalLogs: logs.length,
                totalMinutes,
                avgSessionMinutes: avgSession,
                topActivity: topActivity ? topActivity[0] : 'None'
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get chart data
// @route   GET /api/analytics/charts
// @access  Private
const getAnalyticsCharts = async (req, res) => {
    try {
        const logs = await LogEntry.find({ userId: req.userId }).sort({ createdAt: 1 });

        // 1. Activity Breakdown
        const activityMap = {};
        logs.forEach(log => {
            activityMap[log.activityCategory] = (activityMap[log.activityCategory] || 0) + 1;
        });

        // 2. Time of Day (Hour buckets)
        const timeMap = {};
        logs.forEach(log => {
            const hour = new Date(log.createdAt).getHours();
            // Group: Morning (6-12), Afternoon (12-18), Evening (18-24), Night (0-6)
            let label = 'Night';
            if (hour >= 6 && hour < 12) label = 'Morning';
            else if (hour >= 12 && hour < 18) label = 'Afternoon';
            else if (hour >= 18) label = 'Evening';

            timeMap[label] = (timeMap[label] || 0) + 1;
        });

        // 3. Trend (Last 7 days daily PVI snapshot - simplified)
        // Note: To show "PVI Trend" accurately, we'd need to have stored PVI history.
        // Since we only store current PVI on User, we can assume the user wants log activity trend OR
        // we should have created a PviHistory model.
        // For now, let's return "Minutes Procrastinated per Day" as the trend.

        const trendMap = {};
        logs.forEach(log => {
            const day = new Date(log.createdAt).toISOString().split('T')[0];
            trendMap[day] = (trendMap[day] || 0) + log.durationMinutes;
        });

        const trendData = Object.keys(trendMap).map(date => ({
            date,
            minutes: trendMap[date]
        })).slice(-14); // Last 14 days

        res.status(200).json({
            activityBreakdown: activityMap,
            timeOfDay: timeMap,
            trend: trendData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnalyticsSummary,
    getAnalyticsCharts
};
