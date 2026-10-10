const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), userController.getUsers);
router.post('/', authenticate, authorize('admin'), userController.createUser);

module.exports = router;
