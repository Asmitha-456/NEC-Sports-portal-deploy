const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/audit', authenticate, authorize('staff', 'admin'), reportController.getAuditTrail);
router.get('/export/members', authenticate, authorize('staff', 'admin'), reportController.exportMembersCSV);
router.get('/export/attendance', authenticate, authorize('staff', 'admin'), reportController.exportAttendanceCSV);
router.get('/export/points', authenticate, authorize('staff', 'admin'), reportController.exportPointsCSV);
router.get('/export/audit', authenticate, authorize('staff', 'admin'), reportController.exportAuditCSV);
router.get('/export/od/:batchId', authenticate, authorize('staff', 'admin'), reportController.exportODBatchCSV);

module.exports = router;
