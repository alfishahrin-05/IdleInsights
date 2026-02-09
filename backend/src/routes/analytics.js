const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAnalyticsSummary, getAnalyticsCharts } = require('../controllers/analyticsController');

router.use(protect);

router.get('/summary', getAnalyticsSummary);
router.get('/charts', getAnalyticsCharts);

module.exports = router;
