const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnId: {
    type: String,
    unique: true,
    default: () => 'RET-' + Date.now().toString().slice(-8).toUpperCase()
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderId: { type: String, required: true },
  customer: {
    name: String,
    phone: String,
    email: String
  },
  type: {
    type: String,
    enum: ['return', 'exchange'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['defective', 'wrong-item', 'not-as-described', 'size-issue', 'changed-mind', 'other']
  },
  description: String,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number
  }],
  exchangeFor: String,
  status: {
    type: String,
    enum: ['requested', 'under-review', 'approved', 'rejected', 'pickup-scheduled', 'completed'],
    default: 'requested'
  },
  adminNote: String,
  images: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);
