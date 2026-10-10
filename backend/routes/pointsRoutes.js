const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/departments', optionalAuth, pointsController.getDepartmentPoints);
router.get('/students', optionalAuth, pointsController.getStudentPoints);
router.post('/update', authenticate, authorize('staff', 'admin'), pointsController.updatePoints);

module.exports = router;
