const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: String,
  color: String
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: () => 'VNZ-' + Date.now().toString().slice(-8).toUpperCase()
  },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
      }
    }
  },
  items: [orderItemSchema],
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  couponCode: String,
  payment: {
    method: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['confirmed', 'packed', 'dispatched', 'delivered'],
    default: 'confirmed'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String
  },
  estimatedDelivery: Date,
  deliveredAt: Date,
  notes: String,
  emailSent: {
    customer: { type: Boolean, default: false },
    admin: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Push to status history on status change
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

orderSchema.index({ orderId: 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Order', orderSchema);
