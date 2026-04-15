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

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        store: "Vino'z Fashion"
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// ─── Verify Payment ───────────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId // Our internal order ID
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      // Mark payment as failed
      await Order.findOneAndUpdate(
        { orderId },
        { 'payment.status': 'failed' }
      );
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Update order with payment details
    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        'payment.status': 'paid',
        'payment.razorpayPaymentId': razorpay_payment_id,
        'payment.razorpaySignature': razorpay_signature,
        'payment.paidAt': new Date(),
        status: 'confirmed'
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Deduct stock now that payment is confirmed
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity }
      });
    }

    // Send emails (non-blocking, update flags only on success)
    emailService.sendCustomerOrderEmail(order)
      .then(() => Order.findByIdAndUpdate(order._id, { 'emailSent.customer': true }))
      .catch(err => console.error('Customer email failed:', err.message));
    emailService.sendAdminOrderEmail(order)
      .then(() => Order.findByIdAndUpdate(order._id, { 'emailSent.admin': true }))
      .catch(err => console.error('Admin email failed:', err.message));

    res.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ─── Razorpay Webhook (for server-side payment confirmation) ──────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body.toString();

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      await Order.findOneAndUpdate(
        { 'payment.razorpayOrderId': payment.order_id },
        {
          'payment.status': 'paid',
          'payment.razorpayPaymentId': payment.id,
          'payment.paidAt': new Date(),
          status: 'confirmed'
        }
      );
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      await Order.findOneAndUpdate(
        { 'payment.razorpayOrderId': payment.order_id },
        { 'payment.status': 'failed' }
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
