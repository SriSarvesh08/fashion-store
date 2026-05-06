const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// ─── GET All Products (with filters, sorting, pagination) ─────────────────
router.get('/', async (req, res) => {
  try {
    const { category, color, material, occasion, minPrice, maxPrice, sort = 'createdAt', page = 1, limit = 20, search, featured } = req.query;
    const result = await Product.findWithFilters({ category, color, material, occasion, minPrice, maxPrice, sort, search, featured, page, limit });
    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ─── GET Featured Products ────────────────────────────────────────────────
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.findFeatured(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// ─── GET Single Product by Slug ───────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findBySlug(req.params.slug);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ─── ADMIN: Create Product ────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ─── ADMIN: Update Product ────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ─── ADMIN: Delete Product (soft delete) ──────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.softDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
