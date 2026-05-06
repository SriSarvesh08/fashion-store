const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const emailService = require('../services/emailService');
const authMiddleware = require('../middleware/auth');

// ─── Validation ───────────────────────────────────────────────────────────
const orderValidation = [
  body('customer.name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('customer.phone').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone number required'),
  body('customer.email').optional().isEmail().normalizeEmail(),
  body('customer.address.street').trim().notEmpty().withMessage('Street address required'),
  body('customer.address.city').trim().notEmpty().withMessage('City required'),
  body('customer.address.state').trim().notEmpty().withMessage('State required'),
  body('customer.address.pincode').matches(/^\d{6}$/).withMessage('Valid 6-digit pincode required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('payment.method').isIn(['razorpay']).withMessage('Invalid payment method')
];

// ─── Place Order ──────────────────────────────────────────────────────────
router.post('/', orderValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { customer, items, payment, couponCode, notes } = req.body;

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Product not available: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for: ${product.name}` });
      }
      const price = product.discountPrice || product.price;
      subtotal += price * item.quantity;
      validatedItems.push({
        product: product._id, name: product.name,
        image: product.images[0]?.url, price,
        quantity: item.quantity, size: item.size, color: item.color
      });
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findByCode(couponCode);
      if (coupon) {
        const validity = Coupon.isValid(coupon, subtotal);
        if (validity.valid) {
          discount = Coupon.calculateDiscount(coupon, subtotal);
          await Coupon.incrementUsedCount(coupon._id);
        }
      }
    }

    const shipping = (subtotal - discount) >= 500 ? 0 : 50;
    const total = subtotal - discount + shipping;

    const order = await Order.create({
      customer, items: validatedItems,
      pricing: { subtotal, discount, shipping, total },
      couponCode: couponCode?.toUpperCase(),
      payment: { method: payment.method, status: 'pending' },
      notes,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    });



    res.status(201).json({
      success: true, orderId: order.orderId, _id: order._id,
      total: order.pricing.total, paymentMethod: order.payment.method
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── Get Order by ID (public - with phone verification) ───────────────────
router.get('/track/:orderId', async (req, res) => {
  try {
    const { phone } = req.query;
    const order = await Order.findByOrderId(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (phone && order.customer.phone !== phone) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ─── ADMIN: Get All Orders ────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, paymentMethod, page = 1, limit = 20, search, from, to } = req.query;
    const result = await Order.findWithFilters({ status, paymentMethod, search, from, to, page, limit });
    const stats = await Order.getOrderStats();
    res.json({ ...result, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── ADMIN: Update Order Status ────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, note, tracking } = req.body;
    const validStatuses = ['confirmed', 'packed', 'dispatched', 'delivered'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const deliveredAt = status === 'delivered' ? new Date().toISOString() : undefined;
    const order = await Order.updateStatus(req.params.id, { status, note, tracking, deliveredAt });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    emailService.sendStatusUpdateEmail(order).catch(() => {});
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
