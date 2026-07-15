const prisma = require('../config/db');

function generateOrderId() {
  return 'VNZ-' + Date.now().toString().slice(-8).toUpperCase();
}

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

    const data = await prisma.order.create({ data: dbData });
    return toApiFormat(data);
  },

  async findById(id) {
    const data = await prisma.order.findUnique({ where: { id } });
    return data ? toApiFormat(data) : null;
  },

  async findByOrderId(orderId) {
    const data = await prisma.order.findUnique({ where: { order_id: orderId } });
    return data ? toApiFormat(data) : null;
  },

  async countAll() {
    return await prisma.order.count();
  },

  async findRecent(limit = 5) {
    const data = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      take: limit
    });
    return data.map(toApiFormat);
  },

  async findWithFilters({ status, paymentMethod, search, from, to, page = 1, limit = 20 }) {
    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to) where.created_at.lte = new Date(to);
    }
    
    // Prisma does not easily support JSON filtering unless using raw or specialized args.
    // For simplicity, we use a raw query for complex JSON/ilike searches or just map them where Prisma supports it.
    // We will use Prisma's robust querying where possible, and filter JSON array fields in JS if strictly needed.
    // Assuming simple search on order_id. Searching inside JSON (customer->>name) requires Raw in Prisma if not native.
    if (search) {
      where.order_id = { contains: search, mode: 'insensitive' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    // For payment method, we might have to filter in JS or use Prisma's Json filtering if Postgres supports it (path: ['method'])
    if (paymentMethod) {
      where.payment = { path: ['method'], equals: paymentMethod };
    }

    try {
      const [data, count] = await Promise.all([
        prisma.order.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: Number(limit) }),
        prisma.order.count({ where })
      ]);

      return {
        orders: data.map(toApiFormat),
        pagination: {
          total: count,
          page: Number(page),
          pages: Math.ceil(count / Number(limit))
        }
      };
    } catch (err) {
      // fallback for JSON search if unsupported on this DB version
      return { orders: [], pagination: { total: 0, page: 1, pages: 1 } };
    }
  },

  async updateStatus(id, { status, note, tracking, deliveredAt }) {
    const current = await prisma.order.findUnique({ where: { id }, select: { status_history: true } });
    if (!current) return null;

    const history = (current.status_history || []);
    history.push({ status, timestamp: new Date().toISOString(), note: note || null });

    const updateData = {
      status,
      status_history: history,
      updated_at: new Date()
    };
    if (tracking) updateData.tracking = tracking;
    if (deliveredAt) updateData.delivered_at = deliveredAt;

    const data = await prisma.order.update({ where: { id }, data: updateData });
    return data ? toApiFormat(data) : null;
  },

  async updatePayment(orderId, paymentFields) {
    const current = await prisma.order.findUnique({ where: { order_id: orderId }, select: { payment: true, status_history: true } });
    if (!current) return null;

    const updatedPayment = { ...current.payment, ...paymentFields };
    const updateData = { payment: updatedPayment, updated_at: new Date() };

    if (paymentFields.status === 'paid') {
      updateData.status = 'confirmed';
      const history = current.status_history || [];
      history.push({ status: 'confirmed', timestamp: new Date().toISOString() });
      updateData.status_history = history;
    }

    const data = await prisma.order.update({ where: { order_id: orderId }, data: updateData });
    return data ? toApiFormat(data) : null;
  },

  async updateEmailSent(id, field) {
    const current = await prisma.order.findUnique({ where: { id }, select: { email_sent: true } });
    if (!current) return;
    const emailSent = current.email_sent || { customer: false, admin: false };
    emailSent[field] = true;
    await prisma.order.update({ where: { id }, data: { email_sent: emailSent } });
  },

  async getDashboardStats() {
    // Re-implemented using Prisma raw queries
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const [totalOrders, todayOrders, revenueData, todayRevenueData, statusData] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { created_at: { gte: today } } }),
      prisma.$queryRaw`SELECT SUM(CAST(pricing->>'total' AS NUMERIC)) as total FROM orders`,
      prisma.$queryRaw`SELECT SUM(CAST(pricing->>'total' AS NUMERIC)) as total FROM orders WHERE created_at >= CURRENT_DATE`,
      prisma.$queryRaw`SELECT status, COUNT(*)::int as count FROM orders GROUP BY status`
    ]);

    const dailyRevenueResult = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date, 
        SUM(CAST(pricing->>'total' AS NUMERIC)) as revenue, 
        COUNT(*)::int as order_count 
      FROM orders 
      WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days') 
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') 
      ORDER BY date ASC
    `;

    return {
      totalOrders,
      todayOrders,
      totalRevenue: revenueData[0]?.total || 0,
      todayRevenue: todayRevenueData[0]?.total || 0,
      ordersByStatus: statusData || [],
      dailyRevenue: dailyRevenueResult.map(r => ({
        _id: r.date,
        revenue: r.revenue,
        orders: r.order_count
      }))
    };
  },

  async getOrderStats() {
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({ where: { status: 'confirmed' } });
    const revenueData = await prisma.$queryRaw`SELECT SUM(CAST(pricing->>'total' AS NUMERIC)) as total FROM orders`;

    return {
      totalRevenue: revenueData[0]?.total || 0,
      totalOrders,
      pendingOrders
    };
  },

  async findByRazorpayOrderId(razorpayOrderId) {
    const data = await prisma.order.findFirst({
      where: { payment: { path: ['razorpayOrderId'], equals: razorpayOrderId } }
    });
    return data ? toApiFormat(data) : null;
  }
};

module.exports = Order;
