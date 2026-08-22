const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const orderController = require('../controllers/orderController'); // We will import getDashboardStats from here later

// POST /api/admin/login
router.post('/login', adminController.login);

// GET /api/admin/dashboard
// This route is protected by authMiddleware
router.get('/dashboard', authMiddleware, orderController.getDashboardStats);

module.exports = router;
