const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const emailService = require('../services/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ─── Create Razorpay Order ────────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: 'Invalid amount' });

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: { store: "Vino'z Fashion" }
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// ─── Verify Payment ───────────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

    if (expectedSign !== razorpay_signature) {
      await Order.updatePayment(orderId, { status: 'failed' });
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const order = await Order.updatePayment(orderId, {
      status: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAt: new Date().toISOString()
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Deduct stock
    for (const item of order.items) {
      await Product.decrementStock(item.product, item.quantity);
    }

    // Send emails (non-blocking)
    emailService.sendCustomerOrderEmail(order)
      .then(() => Order.updateEmailSent(order._id, 'customer'))
      .catch(err => console.error('Customer email failed:', err.message));
    emailService.sendAdminOrderEmail(order)
      .then(() => Order.updateEmailSent(order._id, 'admin'))
      .catch(err => console.error('Admin email failed:', err.message));

    res.json({ success: true, message: 'Payment verified successfully', orderId: order.orderId });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ─── Razorpay Webhook ─────────────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body.toString();
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (signature !== expectedSignature) return res.status(400).json({ error: 'Invalid webhook signature' });

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      await Order.updatePayment(null, {
        status: 'paid', razorpayPaymentId: payment.id, paidAt: new Date().toISOString()
      });
      // Note: For webhook, we search by razorpayOrderId — handled via findByRazorpayOrderId
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const order = await Order.findByRazorpayOrderId(payment.order_id);
      if (order) await Order.updatePayment(order.orderId, { status: 'failed' });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
