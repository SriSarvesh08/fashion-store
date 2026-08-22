const db = require('../db');
const { generateOrderId } = require('../services/orderIdService');
const { sendCustomerOrderEmail, sendAdminOrderEmail, sendStatusUpdateEmail } = require('../services/emailService');

exports.createOrder = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const {
      customer_name, customer_phone, customer_email,
      address_street, address_city, address_state, address_pincode,
      items, coupon_code, payment_method
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order items cannot be empty' });
    }

    await client.query('BEGIN');

    let subtotal = 0;
    // Verify stock and calculate subtotal
    for (const item of items) {
      const productRes = await client.query('SELECT name, price, stock, category, images FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      if (productRes.rows.length === 0) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }
      const product = productRes.rows[0];
      
      // If dress with size and color, check variant stock
      if (product.category === 'dresses' && item.size && item.color) {
         let variantStock = 0;
         const images = product.images || [];
         
         const colorImg = images.find(img => img.color && img.color.toLowerCase() === item.color.toLowerCase());
         if (colorImg && colorImg.sizes) {
            if (Array.isArray(colorImg.sizes)) {
               variantStock = 10; // legacy arrays
            } else {
               variantStock = colorImg.sizes[item.size] || 0;
            }
         }
         
         if (variantStock < item.quantity) {
           throw new Error(`Insufficient stock for ${product.name} (Size: ${item.size}, Color: ${item.color})`);
         }
      } else {
         // Fallback to global stock
         if (product.stock < item.quantity) {
           throw new Error(`Insufficient stock for ${product.name}`);
         }
      }

      // Use DB price to avoid client-side spoofing
      item.price = parseFloat(product.price);
      subtotal += item.price * item.quantity;
    }

    let discount = 0;
    if (coupon_code) {
      const couponRes = await client.query('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [coupon_code.toUpperCase()]);
      const coupon = couponRes.rows[0];
      if (coupon && (!coupon.expires_at || new Date() < new Date(coupon.expires_at)) && (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) && (subtotal >= parseFloat(coupon.min_order_amount))) {
        if (coupon.type === 'percentage') {
          discount = (subtotal * parseFloat(coupon.value)) / 100;
          if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) discount = parseFloat(coupon.max_discount);
        } else {
          discount = parseFloat(coupon.value);
        }
        await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [coupon.id]);
      }
    }

    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal - discount + shipping;

    const orderId = generateOrderId();
    const insertQuery = `
      INSERT INTO orders (
        order_id, customer_name, customer_phone, customer_email,
        address_street, address_city, address_state, address_pincode,
        items, subtotal, discount, shipping, total, coupon_code, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const insertValues = [
      orderId, customer_name, customer_phone, customer_email,
      address_street, address_city, address_state, address_pincode,
      JSON.stringify(items), subtotal, discount, shipping, total, coupon_code || null, payment_method
    ];

    const orderRes = await client.query(insertQuery, insertValues);
    const order = orderRes.rows[0];

    // Decrement stock
    for (const item of items) {
      if (item.size && item.color) {
        const pRes = await client.query('SELECT category, images FROM products WHERE id = $1', [item.product_id]);
        if (pRes.rows.length > 0 && pRes.rows[0].category === 'dresses') {
           const images = pRes.rows[0].images || [];
           let updated = false;
           for (let i = 0; i < images.length; i++) {
             const img = images[i];
             if (img.color && img.color.toLowerCase() === item.color.toLowerCase() && img.sizes && !Array.isArray(img.sizes)) {
                if (img.sizes[item.size] !== undefined) {
                  img.sizes[item.size] = Math.max(0, img.sizes[item.size] - item.quantity);
                  updated = true;
                }
             }
           }
           if (updated) {
             await client.query('UPDATE products SET images = $1 WHERE id = $2', [JSON.stringify(images), item.product_id]);
           }
        }
      }
      // Decrement global stock as fallback/aggregate
      await client.query('UPDATE products SET stock = GREATEST(stock - $1, 0), sold_count = sold_count + $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    await client.query('COMMIT');

    // Send emails non-blocking (fire and forget)
    Promise.allSettled([
      sendCustomerOrderEmail(order),
      sendAdminOrderEmail(order),
    ]).catch(() => {}); // never crash

    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.trackOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { phone } = req.query; // optional verification

    let query = 'SELECT * FROM orders WHERE order_id = $1';
    const values = [orderId];

    if (phone) {
      query += ' AND customer_phone = $2';
      values.push(phone);
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, payment_method, search, page = 1, limit = 20 } = req.query;

    let conditions = [];
    const values = [];
    let idx = 1;

    if (status) { conditions.push(`status = $${idx++}`); values.push(status); }
    if (payment_method) { conditions.push(`payment_method = $${idx++}`); values.push(payment_method); }
    if (search) {
      conditions.push(`(order_id ILIKE $${idx} OR customer_name ILIKE $${idx+1} OR customer_phone ILIKE $${idx+2} OR customer_email ILIKE $${idx+3})`);
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
      idx += 4;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const countResult = await db.query(`SELECT COUNT(*) FROM orders ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count);

    const queryValues = [...values, parseInt(limit), offset];
    const result = await db.query(`SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, queryValues);

    res.json({
      orders: result.rows,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) { next(error); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tracking_carrier, tracking_number, tracking_url, estimated_delivery } = req.body;

    let setClauses = ['status = $1'];
    let values = [status];
    let idx = 2;

    if (tracking_carrier !== undefined) { setClauses.push(`tracking_carrier = $${idx++}`); values.push(tracking_carrier); }
    if (tracking_number !== undefined) { setClauses.push(`tracking_number = $${idx++}`); values.push(tracking_number); }
    if (tracking_url !== undefined) { setClauses.push(`tracking_url = $${idx++}`); values.push(tracking_url); }
    if (estimated_delivery !== undefined) { setClauses.push(`estimated_delivery = $${idx++}`); values.push(estimated_delivery); }
    if (status === 'delivered') { setClauses.push(`delivered_at = NOW()`); }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const updatedOrder = result.rows[0];

    // Send status update email non-blocking
    sendStatusUpdateEmail(updatedOrder).catch(() => {});

    res.json(updatedOrder);
  } catch (error) { next(error); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalRevRes = await db.query("SELECT SUM(total) as rev FROM orders WHERE payment_status = 'paid' OR payment_method = 'cod'");
    const todayRevRes = await db.query("SELECT SUM(total) as rev FROM orders WHERE (payment_status = 'paid' OR payment_method = 'cod') AND created_at >= CURRENT_DATE");
    const totalOrdRes = await db.query("SELECT COUNT(*) FROM orders");
    const todayOrdRes = await db.query("SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE");
    const pendingOrdRes = await db.query("SELECT COUNT(*) FROM orders WHERE status = 'placed' OR status = 'processing'");
    const totalProdRes = await db.query("SELECT COUNT(*) FROM products WHERE is_active = true");
    const recentOrdersRes = await db.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5");

    const dailyRevRes = await db.query(`
      SELECT DATE(created_at) as date, SUM(total) as revenue 
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 days' 
        AND (payment_status = 'paid' OR payment_method = 'cod')
      GROUP BY DATE(created_at) 
      ORDER BY DATE(created_at) ASC
    `);

    res.json({
      stats: {
        totalRevenue: parseFloat(totalRevRes.rows[0].rev || 0),
        todayRevenue: parseFloat(todayRevRes.rows[0].rev || 0),
        totalOrders: parseInt(totalOrdRes.rows[0].count),
        todayOrders: parseInt(todayOrdRes.rows[0].count),
        pendingOrders: parseInt(pendingOrdRes.rows[0].count),
        activeProducts: parseInt(totalProdRes.rows[0].count),
      },
      recentOrders: recentOrdersRes.rows,
      revenueChart: dailyRevRes.rows.map(r => ({ date: r.date, revenue: parseFloat(r.revenue) }))
    });
  } catch (error) { next(error); }
};
