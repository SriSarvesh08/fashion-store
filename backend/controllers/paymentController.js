const db = require('../db');
const crypto = require('crypto');
const razorpayService = require('../services/razorpayService');
const { sendCustomerOrderEmail, sendAdminOrderEmail } = require('../services/emailService');

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Securely fetch amount from DB to prevent tampering
    const orderRes = await db.query('SELECT total FROM orders WHERE order_id = $1', [orderId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const amount = orderRes.rows[0].total;

    const order = await razorpayService.createOrder(amount, orderId);
    res.json({
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) { next(error); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, system_order_id } = req.body;

    const isAuthentic = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isAuthentic) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update system order
    const result = await db.query(
      `UPDATE orders SET 
         payment_status = 'paid', 
         razorpay_order_id = $1, 
         razorpay_payment_id = $2, 
         razorpay_signature = $3, 
         paid_at = NOW(), 
         updated_at = NOW() 
       WHERE order_id = $4 RETURNING *`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature, system_order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found to update payment' });
    }

    const order = result.rows[0];

    // Send confirmation emails non-blocking
    Promise.allSettled([
      sendCustomerOrderEmail(order),
      sendAdminOrderEmail(order),
    ]).catch(() => {});

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) { next(error); }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === 'payment.captured') {
      const rpOrderId = paymentEntity.order_id;
      const result = await db.query(
        `UPDATE orders SET 
           payment_status = 'paid', 
           razorpay_payment_id = $1, 
           paid_at = NOW(), 
           updated_at = NOW() 
         WHERE razorpay_order_id = $2 RETURNING *`,
        [paymentEntity.id, rpOrderId]
      );
      if (result.rows.length > 0) {
        const order = result.rows[0];
        Promise.allSettled([
          sendCustomerOrderEmail(order),
          sendAdminOrderEmail(order),
        ]).catch(() => {});
      }
    }

    if (event === 'payment.failed') {
      const rpOrderId = paymentEntity.order_id;
      await db.query(
        `UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE razorpay_order_id = $1`,
        [rpOrderId]
      );
    }

    res.json({ status: 'ok' });
  } catch (error) { next(error); }
};
