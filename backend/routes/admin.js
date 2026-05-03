const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Return = require('../models/Return');
const authMiddleware = require('../middleware/auth');

// Initialize Resend (HTTP-based email — works on Render free tier)
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a 6-digit OTP
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email via Resend HTTP API
async function sendOtpViaResend(toEmail, otpCode) {
  await resend.emails.send({
    from: 'Vinoz Fashion Security <onboarding@resend.dev>',
    to: toEmail,
    subject: `🔐 Your Admin Login OTP - Vino'z Fashion`,
    html: `
      <div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#c9748f,#e8a4b8);padding:25px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px;">Vino'z Fashion</h1>
        </div>
        <div style="padding:30px;">
          <h2 style="color:#c9748f;margin:0 0 5px;">🔐 Admin Login Verification</h2>
          <p style="color:#666;margin:0 0 25px;">Use the following One-Time Password to complete your login:</p>
          <div style="background:linear-gradient(135deg,#fdf6f6,#fff0f5);border-radius:16px;padding:30px;margin-bottom:25px;text-align:center;border:2px solid #f0e6e6;">
            <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
            <p style="margin:0;font-size:42px;font-weight:bold;color:#c9748f;letter-spacing:12px;font-family:monospace;">${otpCode}</p>
          </div>
          <div style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;padding:12px;margin-bottom:20px;">
            <p style="margin:0;color:#e65100;font-size:14px;">⏱️ <strong>This OTP expires in 30 seconds.</strong></p>
            <p style="margin:5px 0 0;color:#666;font-size:13px;">If you did not attempt to log in, please ignore this email.</p>
          </div>
          <p style="color:#888;font-size:13px;">This is an automated security email. Do not share this OTP with anyone.</p>
        </div>
        <div style="background:#fdf6f6;padding:15px;text-align:center;border-top:1px solid #f0e6e6;">
          <p style="margin:0;color:#999;font-size:12px;">© 2026 Vino'z Fashion. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

// ─── Admin Login Step 1: Verify credentials & send OTP ──────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find admin
    let admin = await Admin.findOne({ username });

    // Bootstrap: create admin if none exists
    if (!admin) {
      if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
      ) {
        admin = new Admin({ username, password, email: process.env.ADMIN_EMAIL });
        await admin.save();
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      const isValid = await admin.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Generate OTP and store it (hashed) with a 30-second expiry
    const otpCode = generateOtp();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    admin.otp = {
      code: otpHash,
      expiresAt: new Date(Date.now() + 30 * 1000), // 30 seconds
      attempts: 0
    };
    await admin.save();

    // Send OTP email via Resend HTTP API
    const adminEmail = admin.email || process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return res.status(500).json({ error: 'Admin email not configured. Cannot send OTP.' });
    }

    // Mask the email for display
    const parts = adminEmail.split('@');
    const maskedLocal = parts[0].slice(0, 3) + '***';
    const maskedEmail = `${maskedLocal}@${parts[1]}`;

    // Send response immediately so frontend doesn't timeout
    res.json({
      requiresOtp: true,
      message: 'OTP sent to your registered email',
      maskedEmail,
      adminId: admin._id
    });

    // Send email in background via Resend HTTP API
    sendOtpViaResend(adminEmail, otpCode).catch(emailErr => {
      console.error('Failed to send OTP email via Resend:', emailErr.message);
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

    if (!adminId || !otp) {
      return res.status(400).json({ error: 'Admin ID and OTP are required' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if OTP exists
    if (!admin.otp || !admin.otp.code) {
      return res.status(400).json({ error: 'No OTP request found. Please login again.' });
    }

    // Check if max attempts exceeded (5 attempts max)
    if (admin.otp.attempts >= 5) {
      admin.otp = { code: null, expiresAt: null, attempts: 0 };
      await admin.save();
      return res.status(429).json({ error: 'Too many failed attempts. Please login again.' });
    }

    // Check if OTP has expired
    if (new Date() > admin.otp.expiresAt) {
      admin.otp = { code: null, expiresAt: null, attempts: 0 };
      await admin.save();
      return res.status(400).json({ error: 'OTP has expired. Please login again.' });
    }

    // Verify OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== admin.otp.code) {
      admin.otp.attempts += 1;
      await admin.save();
      const remaining = 5 - admin.otp.attempts;
      return res.status(401).json({
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
      });
    }

    // OTP valid — clear it and issue token
    admin.otp = { code: null, expiresAt: null, attempts: 0 };
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Rate limit: only allow resend if at least 10 seconds have passed
    if (admin.otp && admin.otp.expiresAt) {
      const timeSinceLastOtp = Date.now() - (admin.otp.expiresAt.getTime() - 30 * 1000);
      if (timeSinceLastOtp < 10 * 1000) {
        return res.status(429).json({ error: 'Please wait before requesting a new OTP' });
      }
    }

    // Generate new OTP
    const otpCode = generateOtp();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

    admin.otp = {
      code: otpHash,
      expiresAt: new Date(Date.now() + 30 * 1000),
      attempts: 0
    };
    await admin.save();

    const adminEmail = admin.email || process.env.ADMIN_EMAIL;

    // Send response immediately
    res.json({ message: 'New OTP sent successfully' });

    // Send email in background via Resend
    sendOtpViaResend(adminEmail, otpCode).catch(emailErr => {
      console.error('Failed to resend OTP email via Resend:', emailErr.message);
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      revenueData,
      todayRevenue,
      pendingOrders,
      totalProducts,
      recentOrders,
      ordersByStatus
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.countDocuments({ status: 'placed' }),
      Product.countDocuments({ isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(5),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Revenue last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue: revenueData[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        pendingOrders,
        totalProducts
      },
      recentOrders,
      ordersByStatus,
      dailyRevenue
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// TEMPORARY: Test Resend API
router.get('/test-resend', async (req, res) => {
  try {
    const result = await resend.emails.send({
      from: 'Vinoz Fashion <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL,
      subject: 'Resend Test from Render',
      text: 'If you see this, Resend works!'
    });
    res.json({ success: true, result });
  } catch (error) {
    res.json({ success: false, error: error.message, details: error });
  }
});

module.exports = router;
