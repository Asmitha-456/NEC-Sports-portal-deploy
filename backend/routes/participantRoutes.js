const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/my', optionalAuth, participantController.getMyRegistrations);
router.get('/', optionalAuth, participantController.getParticipants);
router.post('/', optionalAuth, participantController.registerParticipant);
router.post('/register', optionalAuth, participantController.registerParticipant);
router.put('/:id/status', authenticate, authorize('staff', 'admin'), participantController.updateStatus);
router.delete('/:id', optionalAuth, participantController.deleteParticipant);

module.exports = router;
