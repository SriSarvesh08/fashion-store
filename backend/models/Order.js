const supabase = require('../config/supabase');

const TABLE = 'orders';

function generateOrderId() {
  return 'VNZ-' + Date.now().toString().slice(-8).toUpperCase();
}

// Map DB row (snake_case) → API response (camelCase)
function toApiFormat(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    orderId: row.order_id,
    customer: row.customer,
    items: row.items || [],
    pricing: row.pricing,
    couponCode: row.coupon_code,
    payment: row.payment,
    status: row.status,
    statusHistory: row.status_history || [],
    tracking: row.tracking || {},
    estimatedDelivery: row.estimated_delivery,
    deliveredAt: row.delivered_at,
    notes: row.notes,
    emailSent: row.email_sent || { customer: false, admin: false },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const Order = {
  toApiFormat,
  generateOrderId,

  async create(orderData) {
    const dbData = {
      order_id: generateOrderId(),
      customer: orderData.customer,
      items: orderData.items,
      pricing: orderData.pricing,
      coupon_code: orderData.couponCode,
      payment: orderData.payment,
      status: 'confirmed',
      status_history: [{ status: 'confirmed', timestamp: new Date().toISOString() }],
      tracking: {},
      estimated_delivery: orderData.estimatedDelivery,
      notes: orderData.notes,
      email_sent: { customer: false, admin: false }
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(dbData)
      .select()
      .single();
    if (error) throw error;
    return toApiFormat(data);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toApiFormat(data) : null;
  },

  async findByOrderId(orderId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('order_id', orderId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toApiFormat(data) : null;
  },

  async countAll() {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async findRecent(limit = 5) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(toApiFormat);
  },

  async findWithFilters({ status, paymentMethod, search, from, to, page = 1, limit = 20 }) {
    let query = supabase.from(TABLE).select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (paymentMethod) query = query.eq('payment->>method', paymentMethod);
    if (from) query = query.gte('created_at', new Date(from).toISOString());
    if (to) query = query.lte('created_at', new Date(to).toISOString());
    if (search) {
      query = query.or(`order_id.ilike.%${search}%,customer->>name.ilike.%${search}%,customer->>phone.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      orders: (data || []).map(toApiFormat),
      pagination: {
        total: count || 0,
        page: Number(page),
        pages: Math.ceil((count || 0) / Number(limit))
      }
    };
  },

  async updateStatus(id, { status, note, tracking, deliveredAt }) {
    // Fetch current order to append to status_history
    const { data: current, error: readErr } = await supabase
      .from(TABLE)
      .select('status_history')
      .eq('id', id)
      .single();
    if (readErr) throw readErr;

    const history = current?.status_history || [];
    history.push({ status, timestamp: new Date().toISOString(), note: note || null });

    const updateData = {
      status,
      status_history: history,
      updated_at: new Date().toISOString()
    };
    if (tracking) updateData.tracking = tracking;
    if (deliveredAt) updateData.delivered_at = deliveredAt;

    const { data, error } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data ? toApiFormat(data) : null;
  },

  async updatePayment(orderId, paymentFields) {
    // Merge payment fields with existing payment data
    const { data: current, error: readErr } = await supabase
      .from(TABLE)
      .select('payment, status_history')
      .eq('order_id', orderId)
      .single();
    if (readErr) throw readErr;
    if (!current) return null;

    const updatedPayment = { ...current.payment, ...paymentFields };
    const updateData = { payment: updatedPayment, updated_at: new Date().toISOString() };

    // If payment status is 'paid', also set order status to 'confirmed'
    if (paymentFields.status === 'paid') {
      updateData.status = 'confirmed';
      const history = current.status_history || [];
      history.push({ status: 'confirmed', timestamp: new Date().toISOString() });
      updateData.status_history = history;
    }
    if (paymentFields.status === 'failed') {
      // Just update payment status
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq('order_id', orderId)
      .select()
      .single();
    if (error) throw error;
    return data ? toApiFormat(data) : null;
  },

  async updateEmailSent(id, field) {
    const { data: current, error: readErr } = await supabase
      .from(TABLE)
      .select('email_sent')
      .eq('id', id)
      .single();
    if (readErr) return; // non-critical

    const emailSent = current?.email_sent || { customer: false, admin: false };
    emailSent[field] = true;

    await supabase
      .from(TABLE)
      .update({ email_sent: emailSent })
      .eq('id', id);
  },

  // Dashboard stats via RPC
  async getDashboardStats() {
    const [
      totalOrdersResult,
      todayCountResult,
      totalRevenueResult,
      todayRevenueResult,
      ordersByStatusResult,
      dailyRevenueResult
    ] = await Promise.all([
      supabase.from(TABLE).select('*', { count: 'exact', head: true }),
      supabase.rpc('get_today_order_count'),
      supabase.rpc('get_total_revenue'),
      supabase.rpc('get_today_revenue'),
      supabase.rpc('get_orders_by_status'),
      supabase.rpc('get_daily_revenue', { days: 7 })
    ]);

    return {
      totalOrders: totalOrdersResult.count || 0,
      todayOrders: todayCountResult.data || 0,
      totalRevenue: totalRevenueResult.data || 0,
      todayRevenue: todayRevenueResult.data || 0,
      ordersByStatus: ordersByStatusResult.data || [],
      dailyRevenue: (dailyRevenueResult.data || []).map(r => ({
        _id: r.date,
        revenue: r.revenue,
        orders: r.order_count
      }))
    };
  },

  // Order stats for admin order list
  async getOrderStats() {
    const { data, error } = await supabase.rpc('get_order_stats');
    if (error) throw error;
    return data ? {
      totalRevenue: data[0]?.total_revenue || 0,
      totalOrders: data[0]?.total_orders || 0,
      pendingOrders: data[0]?.pending_orders || 0
    } : {};
  },

  // Find by razorpay order ID (inside JSONB payment field)
  async findByRazorpayOrderId(razorpayOrderId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('payment->>razorpayOrderId', razorpayOrderId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toApiFormat(data) : null;
  }
};

module.exports = Order;
