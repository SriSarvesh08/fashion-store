const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['earrings', 'hair-clips', 'bangles', 'chains', 'rings', 'necklaces', 'bracelets', 'other']
  },
  material: {
    type: String,
    enum: ['gold', 'silver', 'rose-gold', 'oxidised', 'fabric', 'beaded', 'pearl', 'crystal', 'other']
  },
  occasion: [{
    type: String,
    enum: ['casual', 'wedding', 'party', 'office', 'festival', 'daily-wear']
  }],
  colors: [{
    type: String,
    trim: true
  }],
  images: [{
    url: { type: String, required: true },
    publicId: String,
    alt: String,
    color: String,
    isFront: { type: Boolean, default: false }
  }],
  videoUrl: String,
  wornImageUrl: String,
  stock: {
    type: Number,
    default: 100,
    min: [0, 'Stock cannot be negative']
  },
  sizes: [{
    label: String,
    value: String
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  deliveryTime: {
    type: String,
    default: '3-5 business days'
  },
  returnPolicy: {
    type: String,
    default: '7-day easy return & exchange'
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  soldCount: {
    type: Number,
    default: 0
  },
  instagramReelUrl: String,
  seoTitle: String,
  seoDescription: String
}, {
  timestamps: true
});

// Auto-generate slug
productSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + this._id.toString().slice(-4);
  }
  next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (this.discountPrice && this.price > this.discountPrice) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });

// Indexes for fast queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
