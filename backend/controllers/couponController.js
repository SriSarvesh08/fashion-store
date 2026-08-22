const db = require('../db');

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || subtotal === undefined) {
      return res.status(400).json({ error: 'Code and subtotal are required' });
    }

    const result = await db.query('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [code.toUpperCase()]);
    const coupon = result.rows[0];

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or inactive coupon' });
    }

    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      return res.status(400).json({ error: 'Coupon expired' });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    if (parseFloat(subtotal) < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({ error: `Minimum order amount of ₹${coupon.min_order_amount} required` });
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (parseFloat(subtotal) * parseFloat(coupon.value)) / 100;
      if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
        discountAmount = parseFloat(coupon.max_discount);
      }
    } else {
      discountAmount = parseFloat(coupon.value);
    }

    res.json({
      discountAmount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      }
    });
  } catch (error) { next(error); }
};

exports.getAllCoupons = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { next(error); }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const { code, type, value, min_order_amount, max_discount, usage_limit, expires_at, description } = req.body;
    const query = `
      INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, expires_at, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    const values = [
      code.toUpperCase(), type, value, min_order_amount || 0,
      max_discount, usage_limit, expires_at, description
    ];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) { 
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    next(error);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM coupons WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (error) { next(error); }
};
