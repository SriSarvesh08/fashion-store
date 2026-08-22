const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder(amount, receipt) {
  const options = {
    amount: Math.round(parseFloat(amount) * 100), // convert to paise
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`
  };
  return await razorpay.orders.create(options);
}

function verifySignature(orderId, paymentId, signature) {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

module.exports = { razorpay, createOrder, verifySignature };
