const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', adminController.register);

// Protected routes
router.get('/settings', authenticateAdmin, adminController.getSettings);
router.get('/jobs', authenticateAdmin, adminController.getJobs);
router.post('/jobs', authenticateAdmin, adminController.createJob);
router.patch('/jobs/:id', authenticateAdmin, adminController.updateJob);
router.get('/applications', authenticateAdmin, adminController.getApplications);
router.patch('/applications/:id', authenticateAdmin, adminController.updateApplication);

module.exports = router;