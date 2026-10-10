const express = require('express');
const router = express.Router();
const odController = require('../controllers/odController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Automatic OD Generation Engine (Staff / Admin)
router.post('/auto-generate', authenticate, authorize('staff', 'admin'), odController.autoGenerateOD);

// Manage OD Batches (Staff / Admin for mutation, optionalAuth for reading)
router.get('/batches', optionalAuth, odController.getODBatches);
router.get('/batches/:id', optionalAuth, odController.getODBatchById);
router.get('/batches/:id/whatsapp-hod', optionalAuth, odController.getHODWhatsAppOD);
router.put('/batches/:id/status', authenticate, authorize('staff', 'admin'), odController.updateODStatus);
router.delete('/batches/:id', authenticate, authorize('staff', 'admin'), odController.deleteODBatch);

// Department-level OD Analytics
router.get('/analytics', optionalAuth, odController.getODAnalytics);

// Student Self-Service: personal OD pass retrieval (Public / Student / Staff / Admin)
router.get('/student/:reg?', optionalAuth, odController.getStudentOD);

// Email OD Letter Dispatcher (Staff / Admin)
router.post('/email-dispatch', authenticate, authorize('staff', 'admin'), odController.emailDispatchOD);

module.exports = router;
