const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-order', paymentController.createRazorpayOrder);
router.post('/verify', paymentController.verifyPayment);

// Note: Ensure bodyParser.raw is used for this specific endpoint in server.js 
// if raw body is needed for webhook signature verification.
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
