const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const authMiddleware = require('../middleware/auth');

// ─── Validate Coupon (public) ─────────────────────────────────────────────
router.post('/validate', async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required' });

    const coupon = await Coupon.findByCode(code);
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });

    const validity = Coupon.isValid(coupon, amount || 0);
    if (!validity.valid) return res.status(400).json({ error: validity.message });

    const discount = Coupon.calculateDiscount(coupon, amount || 0);
    res.json({
      valid: true, code: coupon.code, discount,
      description: coupon.description || `${coupon.type === 'percentage' ? coupon.value + '%' : '₹' + coupon.value} off`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// ─── ADMIN: Get All Coupons ───────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.findAll();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// ─── ADMIN: Create Coupon ─────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// ─── ADMIN: Delete Coupon ─────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Coupon.delete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;
