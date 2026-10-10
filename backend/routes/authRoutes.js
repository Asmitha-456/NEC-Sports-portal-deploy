const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.get('/config', (req, res) => {
  res.json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});
router.get('/me', authenticate, authController.getMe);

module.exports = router;
