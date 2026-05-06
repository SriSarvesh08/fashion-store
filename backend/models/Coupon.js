const supabase = require('../config/supabase');
const TABLE = 'coupons';

function toApiFormat(row) {
  if (!row) return null;
  return {
    _id: row.id, id: row.id, code: row.code, type: row.type,
    value: Number(row.value), minOrderAmount: Number(row.min_order_amount) || 0,
    maxDiscount: row.max_discount ? Number(row.max_discount) : null,
    usageLimit: row.usage_limit, usedCount: row.used_count || 0,
    isActive: row.is_active, expiresAt: row.expires_at,
    description: row.description, createdAt: row.created_at, updatedAt: row.updated_at
  };
}

function toDbFormat(body) {
  const m = {};
  if (body.code !== undefined) m.code = body.code.toUpperCase();
  if (body.type !== undefined) m.type = body.type;
  if (body.value !== undefined) m.value = body.value;
  if (body.minOrderAmount !== undefined) m.min_order_amount = body.minOrderAmount;
  if (body.maxDiscount !== undefined) m.max_discount = body.maxDiscount;
  if (body.usageLimit !== undefined) m.usage_limit = body.usageLimit;
  if (body.isActive !== undefined) m.is_active = body.isActive;
  if (body.expiresAt !== undefined) m.expires_at = body.expiresAt;
  if (body.description !== undefined) m.description = body.description;
  return m;
}

function isValid(coupon, orderAmount) {
  if (!coupon.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) return { valid: false, message: 'Coupon has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < coupon.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` };
  return { valid: true };
}

function calculateDiscount(coupon, amount) {
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (amount * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else { discount = coupon.value; }
  return Math.min(discount, amount);
}

const Coupon = {
  toApiFormat, toDbFormat, isValid, calculateDiscount,
  async findByCode(code) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('code', code.toUpperCase()).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toApiFormat(data) : null;
  },
  async findAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(toApiFormat);
  },
  async create(body) {
    const { data, error } = await supabase.from(TABLE).insert(toDbFormat(body)).select().single();
    if (error) { if (error.code === '23505') { const e = new Error('Coupon code already exists'); e.code = 11000; throw e; } throw error; }
    return toApiFormat(data);
  },
  async delete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
  async incrementUsedCount(id) {
    const { data: c } = await supabase.from(TABLE).select('used_count').eq('id', id).single();
    await supabase.from(TABLE).update({ used_count: (c?.used_count || 0) + 1 }).eq('id', id);
  }
};

module.exports = Coupon;
