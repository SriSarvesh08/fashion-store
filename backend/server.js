const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./db'); // Require our pg pool

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://via.placeholder.com"],
      connectSrc: ["'self'", "https://api.razorpay.com"]
    }
  }
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL, process.env.ADMIN_FRONTEND_URL]
  : [process.env.FRONTEND_URL, process.env.ADMIN_FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: 'Too many requests. Please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' }
});

app.use('/api/', generalLimiter);
app.use('/api/admin/login', loginLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
// Skip JSON parsing for Razorpay webhook (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    return express.raw({ type: 'application/json' })(req, res, next);
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Database Test ──────────────────────────────────────────────────────────
db.pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err.message);
    process.exit(1);
  } else {
    console.log('✅ PostgreSQL connected successfully at:', res.rows[0].now);
  }
});

// ─── Static Files (uploaded images) ──────────────────────────────────────────
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
// main payments router (webhook is already handled above)
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/upload', require('./routes/upload'));

// ─── Root & Health Check ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: "Vino'z Fashion API",
    status: 'running',
    version: '2.0.0',
    endpoints: ['/api/products', '/api/orders', '/api/payments', '/api/admin', '/api/returns', '/api/coupons', '/health']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.stack
  });
});

// ─── Start Server & Graceful Shutdown ────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Vino'z Fashion server running on port ${PORT}`);
});

const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    db.pool.end(() => {
      console.log('PostgreSQL pool closed.');
      process.exit(0);
    });
  });
  
  // Force close after 10s
  setTimeout(() => {
    console.error('Forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
