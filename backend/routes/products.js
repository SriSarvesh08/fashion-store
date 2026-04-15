const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// Escape special RegExp characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── GET All Products (with filters, sorting, pagination) ─────────────────
router.get('/', async (req, res) => {
  try {
    const {
      category, color, material, occasion,
      minPrice, maxPrice, sort = 'createdAt',
      order = 'desc', page = 1, limit = 20,
      search, featured
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (material) filter.material = material;
    if (occasion) filter.occasion = { $in: [occasion] };
    if (color) filter.colors = { $in: [new RegExp(escapeRegex(color), 'i')] };
    if (featured === 'true') filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.$or = [
        {
          discountPrice: {
            ...(minPrice && { $gte: Number(minPrice) }),
            ...(maxPrice && { $lte: Number(maxPrice) })
          }
        },
        {
          discountPrice: { $exists: false },
          price: {
            ...(minPrice && { $gte: Number(minPrice) }),
            ...(maxPrice && { $lte: Number(maxPrice) })
          }
        }
      ];
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'newest': { createdAt: -1 },
      'popular': { soldCount: -1 },
      'rating': { 'ratings.average': -1 }
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    res.json({
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ─── GET Featured Products ────────────────────────────────────────────────
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('name slug price discountPrice images category ratings');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// ─── GET Single Product by Slug ───────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true
    }).select('-__v');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ─── ADMIN: Create Product ────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ─── ADMIN: Update Product ────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ─── ADMIN: Delete Product ────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
