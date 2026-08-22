const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

router.post('/', orderController.createOrder);
router.get('/track/:orderId', orderController.trackOrder);

router.get('/', authMiddleware, orderController.getAllOrders);
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
