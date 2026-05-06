const supabase = require('../config/supabase');
const TABLE = 'returns';

function generateReturnId() {
  return 'RET-' + Date.now().toString().slice(-8).toUpperCase();
}

function toApiFormat(row) {
  if (!row) return null;
  return {
    _id: row.id, id: row.id, returnId: row.return_id,
    order: row.order_ref, orderId: row.order_id,
    customer: row.customer, type: row.type, reason: row.reason,
    description: row.description, items: row.items || [],
    exchangeFor: row.exchange_for, status: row.status,
    adminNote: row.admin_note, images: row.images || [],
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

const Return = {
  toApiFormat,
  async create({ orderRef, orderId, customer, type, reason, description, items, exchangeFor }) {
    const { data, error } = await supabase.from(TABLE).insert({
      return_id: generateReturnId(), order_ref: orderRef, order_id: orderId,
      customer, type, reason, description, items: items || [], exchange_for: exchangeFor
    }).select().single();
    if (error) throw error;
    return toApiFormat(data);
  },
  async findAll() {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(toApiFormat);
  },
  async updateStatus(id, { status, adminNote }) {
    const update = { status, updated_at: new Date().toISOString() };
    if (adminNote !== undefined) update.admin_note = adminNote;
    const { data, error } = await supabase.from(TABLE).update(update).eq('id', id).select().single();
    if (error) throw error;
    return data ? toApiFormat(data) : null;
  }
};

module.exports = Return;
