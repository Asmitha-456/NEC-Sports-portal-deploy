const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, notificationController.getNotifications);
router.put('/read-all', optionalAuth, notificationController.markAllRead);
router.post('/read-all', optionalAuth, notificationController.markAllRead);
router.put('/:id/read', optionalAuth, notificationController.markOneRead);
router.delete('/:id', optionalAuth, notificationController.deleteNotification);
router.delete('/', optionalAuth, notificationController.clearAll);
router.post('/clear', optionalAuth, notificationController.clearAll);
router.post('/', authenticate, authorize('staff', 'admin'), notificationController.createNotification);

module.exports = router;
