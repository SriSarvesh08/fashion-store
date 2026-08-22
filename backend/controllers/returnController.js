const db = require('../db');
const { generateReturnId } = require('../services/orderIdService');
const { sendReturnConfirmationEmail } = require('../services/emailService');

exports.submitReturn = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { order_id, customer_phone, customer_name, customer_email, type, reason, description, exchange_for } = req.body;

    await client.query('BEGIN');

    // Find order
    const orderRes = await client.query('SELECT * FROM orders WHERE order_id = $1 AND customer_phone = $2 FOR UPDATE', [order_id, customer_phone]);
    const order = orderRes.rows[0];

    if (!order) {
      throw new Error('Order not found or phone number mismatch');
    }
    if (order.status !== 'delivered') {
      throw new Error('Returns can only be requested for delivered orders');
    }

    const returnId = generateReturnId();
    const insertQuery = `
      INSERT INTO returns (
        return_id, order_id, customer_name, customer_phone, customer_email,
        type, reason, description, exchange_for
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `;
    const values = [returnId, order.id, customer_name, customer_phone, customer_email, type, reason, description, exchange_for];
    const returnReq = await client.query(insertQuery, values);

    // Update order status
    await client.query("UPDATE orders SET status = 'return-requested', updated_at = NOW() WHERE id = $1", [order.id]);

    await client.query('COMMIT');

    const returnRequest = returnReq.rows[0];

    // Send return confirmation email non-blocking
    sendReturnConfirmationEmail(returnRequest).catch(() => {});

    res.status(201).json(returnRequest);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.getAllReturns = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT r.*, o.order_id as original_order_id 
      FROM returns r 
      JOIN orders o ON r.order_id = o.id 
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) { next(error); }
};

exports.updateReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    let setClauses = [];
    let values = [];
    let idx = 1;

    if (status !== undefined) { setClauses.push(`status = $${idx++}`); values.push(status); }
    if (admin_note !== undefined) { setClauses.push(`admin_note = $${idx++}`); values.push(admin_note); }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE returns SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Return request not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};
