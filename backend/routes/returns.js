const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// ─── Submit Return Request ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { orderId, type, reason, description, items, exchangeFor, phone } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customer.phone !== phone) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!['delivered'].includes(order.status)) {
      return res.status(400).json({ error: 'Returns only accepted for delivered orders' });
    }

    const returnRequest = new Return({
      order: order._id,
      orderId,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email
      },
      type, reason, description, items, exchangeFor
    });

    await returnRequest.save();
    await Order.findByIdAndUpdate(order._id, { status: 'return-requested' });

    res.status(201).json({
      success: true,
      returnId: returnRequest.returnId,
      message: 'Return request submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit return request' });
  }
});

// ─── ADMIN: Get All Returns ────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const returns = await Return.find().sort({ createdAt: -1 }).populate('order');
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// ─── ADMIN: Update Return Status ──────────────────────────────────────────
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const returnReq = await Return.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    if (!returnReq) return res.status(404).json({ error: 'Return request not found' });
    res.json(returnReq);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update return' });
  }
});

module.exports = router;
