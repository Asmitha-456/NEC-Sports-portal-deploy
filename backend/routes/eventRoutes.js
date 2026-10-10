const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Public or authenticated list & view
router.get('/', optionalAuth, eventController.getEvents);
router.get('/:id', optionalAuth, eventController.getEventById);

// Staff and Admin operations
router.post('/', authenticate, authorize('staff', 'admin'), eventController.createEvent);
router.post('/:id/conclude', authenticate, authorize('staff', 'admin'), eventController.concludeEvent);
router.put('/:id', authenticate, authorize('staff', 'admin'), eventController.updateEvent);
router.delete('/:id', authenticate, authorize('staff', 'admin'), eventController.deleteEvent);

module.exports = router;
