const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if any admin exists
    const adminCountResult = await db.query('SELECT COUNT(*) FROM admins');
    const adminCount = parseInt(adminCountResult.rows[0].count, 10);

    // Auto-create first admin if no admins exist and credentials match env vars
    if (adminCount === 0 && username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await db.query(
        'INSERT INTO admins (username, password_hash, email) VALUES ($1, $2, $3) RETURNING *',
        [username, hashedPassword, process.env.ADMIN_EMAIL || 'admin@vinozfashion.com']
      );

      const token = jwt.sign(
        { id: newAdmin.rows[0].id, username: newAdmin.rows[0].username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({ token, username });
    }

    // Normal login flow
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last_login
    await db.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: admin.username });
  } catch (error) {
    next(error);
  }
};
