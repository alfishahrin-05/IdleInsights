const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getLogs, createLog, updateLog, deleteLog } = require('../controllers/logController');

router.use(protect);

router.route('/')
    .get(getLogs)
    .post(createLog);

router.route('/:id')
    .put(updateLog)
    .delete(deleteLog);

module.exports = router;
