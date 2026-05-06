const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const Product = require('../models/Product');
const emailService = require('../services/emailService');
const authMiddleware = require('../middleware/auth');

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// ─── Admin Login Step 1: Verify credentials & send OTP ──────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    let admin = await Admin.findByUsername(username);

    // Bootstrap: create admin if none exists
    if (!admin) {
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        admin = await Admin.create({ username, password, email: process.env.ADMIN_EMAIL });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      const isValid = await Admin.comparePassword(password, admin.password);
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    }

    const otpCode = generateOtp();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    await Admin.update(admin.id, {
      otp_code: otpHash,
      otp_expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
      otp_attempts: 0
    });

    const adminEmail = admin.email || process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ error: 'Admin email not configured.' });

    const parts = adminEmail.split('@');
    const maskedEmail = `${parts[0].slice(0, 3)}***@${parts[1]}`;

    res.json({ requiresOtp: true, message: 'OTP sent to your registered email', maskedEmail, adminId: admin.id });

    emailService.sendOtpEmail(adminEmail, otpCode).catch(err => {
      console.error('Failed to send OTP email via Resend:', err.message);
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── Admin Login Step 2: Verify OTP & issue token ──────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { adminId, otp } = req.body;
    if (!adminId || !otp) return res.status(400).json({ error: 'Admin ID and OTP are required' });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (!admin.otp_code) return res.status(400).json({ error: 'No OTP request found. Please login again.' });

    if (admin.otp_attempts >= 5) {
      await Admin.update(adminId, { otp_code: null, otp_expires_at: null, otp_attempts: 0 });
      return res.status(429).json({ error: 'Too many failed attempts. Please login again.' });
    }

    if (new Date() > new Date(admin.otp_expires_at)) {
      await Admin.update(adminId, { otp_code: null, otp_expires_at: null, otp_attempts: 0 });
      return res.status(400).json({ error: 'OTP has expired. Please login again.' });
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== admin.otp_code) {
      await Admin.update(adminId, { otp_attempts: admin.otp_attempts + 1 });
      const remaining = 5 - (admin.otp_attempts + 1);
      return res.status(401).json({ error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
    }

    await Admin.update(adminId, { otp_code: null, otp_expires_at: null, otp_attempts: 0, last_login: new Date().toISOString() });

    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: admin.username });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// ─── Resend OTP ─────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (admin.otp_expires_at) {
      const timeSince = Date.now() - (new Date(admin.otp_expires_at).getTime() - 30 * 1000);
      if (timeSince < 10 * 1000) return res.status(429).json({ error: 'Please wait before requesting a new OTP' });
    }

    const otpCode = generateOtp();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    await Admin.update(adminId, {
      otp_code: otpHash,
      otp_expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
      otp_attempts: 0
    });

    const adminEmail = admin.email || process.env.ADMIN_EMAIL;
    res.json({ message: 'New OTP sent successfully' });

    emailService.sendOtpEmail(adminEmail, otpCode).catch(err => {
      console.error('Failed to resend OTP email via Resend:', err.message);
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const totalProducts = await Product.countActive();
    const dashStats = await Order.getDashboardStats();
    const recentOrders = await Order.findRecent(5);

    res.json({
      stats: {
        totalOrders: dashStats.totalOrders,
        todayOrders: dashStats.todayOrders,
        totalRevenue: dashStats.totalRevenue,
        todayRevenue: dashStats.todayRevenue,
        pendingOrders: 0,
        totalProducts
      },
      recentOrders,
      ordersByStatus: dashStats.ordersByStatus,
      dailyRevenue: dashStats.dailyRevenue
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
