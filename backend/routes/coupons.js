const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/auth');

router.post('/validate', couponController.validateCoupon);

router.get('/', authMiddleware, couponController.getAllCoupons);
router.post('/', authMiddleware, couponController.createCoupon);
router.delete('/:id', authMiddleware, couponController.deleteCoupon);

module.exports = router;
