const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const emailService = require('../services/emailService');
const authMiddleware = require('../middleware/auth');

// Escape special RegExp characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { customer, items, payment, couponCode, notes } = req.body;

    // Validate items and calculate pricing
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
        product: product._id,
        name: product.name,
        image: product.images[0]?.url,
        price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      });
    }

    // Apply coupon
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        const validity = coupon.isValid(subtotal);
        if (validity.valid) {
          discount = coupon.calculateDiscount(subtotal);
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
        }
      }
    }

    // Free shipping above ₹500
    const shipping = (subtotal - discount) >= 500 ? 0 : 50;
    const total = subtotal - discount + shipping;

    // Create order
    const order = new Order({
      customer,
      items: validatedItems,
      pricing: { subtotal, discount, shipping, total },
      couponCode: couponCode?.toUpperCase(),
      payment: {
        method: payment.method,
        status: 'pending'
      },
      notes,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });

    await order.save();

    // Stock deduction happens after Razorpay payment verification (see payments.js)

    res.status(201).json({
      success: true,
      orderId: order.orderId,
      _id: order._id,
      total: order.pricing.total,
      paymentMethod: order.payment.method
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
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('items.product', 'name images slug');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Basic security: verify phone
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
    const {
      status, paymentMethod, page = 1, limit = 20,
      search, from, to
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter['payment.method'] = paymentMethod;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { orderId: new RegExp(safeSearch, 'i') },
        { 'customer.name': new RegExp(safeSearch, 'i') },
        { 'customer.phone': new RegExp(safeSearch, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Summary stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      stats: stats[0] || {}
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── ADMIN: Update Order Status ────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, note, tracking } = req.body;

    const validStatuses = ['confirmed', 'packed', 'dispatched', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const update = { status, note };
    if (tracking) update.tracking = tracking;
    if (status === 'delivered') update.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Send status update email
    emailService.sendStatusUpdateEmail(order).catch(() => {});

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
