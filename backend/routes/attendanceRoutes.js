const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('staff', 'admin'), attendanceController.getAttendanceByEvent);
router.post('/', authenticate, authorize('staff', 'admin'), attendanceController.saveAttendance);

module.exports = router;
