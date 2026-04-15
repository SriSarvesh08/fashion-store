# Vino'z Fashion — Full-Stack eCommerce

> Production-ready women's accessories store built with React + Node.js + MongoDB + Razorpay

---

## 🗂 Project Structure

```
vinoz-fashion/
├── frontend/          ← React + Tailwind (deploy to Vercel)
└── backend/           ← Node.js + Express (deploy to Railway/Render)
```

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials in .env
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# .env.local → VITE_API_URL=http://localhost:5000/api
npm run dev
# App runs on http://localhost:3000
```

---

## 🔐 Environment Variables (Backend)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random strong secret (32+ chars) |
| `RAZORPAY_KEY_ID` | Razorpay live/test key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `SMTP_HOST` | SMTP host (smtp.gmail.com) |
| `SMTP_PORT` | 587 for TLS |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password |
| `ADMIN_EMAIL` | Email to receive order notifications |
| `ADMIN_USERNAME` | Admin panel username |
| `ADMIN_PASSWORD` | Admin panel password |
| `FRONTEND_URL` | Your deployed frontend URL (for CORS) |

---

## 🚀 Production Deployment

### Backend → Railway

1. Push backend folder to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add all environment variables in Railway dashboard
4. Railway auto-detects Node.js and deploys

### Frontend → Vercel

1. Push frontend folder to GitHub
2. Import to Vercel
3. Set `VITE_API_URL` = your Railway backend URL
4. Deploy

### Database → MongoDB Atlas

1. Create free cluster at mongodb.com/atlas
2. Whitelist IP `0.0.0.0/0` for Railway
3. Copy connection string to `MONGODB_URI`

---

## 💳 Razorpay Setup

1. Create account at razorpay.com
2. Go to Settings → API Keys
3. Copy Key ID and Key Secret to `.env`
4. For production: complete KYC and switch to live keys
5. Add webhook URL: `https://your-backend.railway.app/api/payments/webhook`
   - Events to enable: `payment.captured`, `payment.failed`

---

## 📧 Gmail SMTP Setup

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate app password for "Mail"
4. Use that password as `SMTP_PASS`

---

## 🛠 Admin Panel

Access: `https://your-frontend.vercel.app/admin`

Default login: Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in backend `.env`

Features:
- 📊 Dashboard with revenue stats
- 📦 Product management (add/edit/delete)
- 🛍️ Order management (update status, add tracking)
- 🔁 Returns & exchanges
- 🎟️ Coupon/discount management

---

## 📦 Order Flow

```
Customer adds to cart (localStorage)
        ↓
Checkout (name, phone, address)
        ↓
Choose payment: Razorpay or COD
        ↓
[Razorpay] → Backend creates Razorpay order
           → Frontend opens Razorpay modal
           → On success → Backend verifies signature
        ↓
Order saved to MongoDB
        ↓
Emails sent (customer + admin via Nodemailer)
        ↓
Admin updates status → Email sent to customer
```

---

## 🎟 Coupon Codes

Create coupons in Admin Panel:
- `WELCOME10` → 10% off on first order
- `FLAT50` → ₹50 off on orders above ₹300
- etc.

---

## 📱 Features Summary

| Feature | Status |
|---|---|
| Product listing with filters | ✅ |
| Product detail with zoom | ✅ |
| Cart (localStorage) | ✅ |
| Wishlist (localStorage) | ✅ |
| Guest checkout | ✅ |
| Razorpay payment | ✅ |
| COD payment | ✅ |
| Order confirmation emails | ✅ |
| Admin email notifications | ✅ |
| Order tracking | ✅ |
| Return/exchange requests | ✅ |
| Admin dashboard | ✅ |
| Product management | ✅ |
| Order management | ✅ |
| Coupon system | ✅ |
| Mobile responsive | ✅ |
| Free shipping logic | ✅ |

---

## 🔒 Security Notes

- All admin routes require JWT token
- Razorpay signature verified server-side
- Input validation on all API endpoints
- Rate limiting on API routes
- CORS restricted to your frontend URL
- Environment variables for all secrets

---

Made with 💕 for Vino'z Fashion
