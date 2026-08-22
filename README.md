# Vino'z Fashion eCommerce

Vino'z Fashion is a full-stack, production-ready eCommerce application built with React, Node.js, and PostgreSQL. It features a modern pastel blush design, complete Razorpay payment integration, order tracking, and a comprehensive Admin management dashboard.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, lucide-react |
| **Backend** | Node.js, Express, `pg` (raw SQL queries), JWT, bcryptjs |
| **Database** | PostgreSQL |
| **Payments** | Razorpay |
| **Emails** | Nodemailer (Gmail SMTP) |

## Project Structure

```
vinoz-fashion/
├── backend/
│   ├── db/
│   │   ├── index.js          # PostgreSQL pool connection
│   │   ├── migrate.js        # Standalone migration script
│   │   ├── schema.sql        # Database schema definitions
│   │   └── seed.sql          # Initial seed data
│   ├── controllers/          # Express route controllers
│   ├── middleware/           # Auth and validation middleware
│   ├── routes/               # API route definitions
│   ├── services/             # Email service wrapper
│   ├── server.js             # Main application entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/       # Reusable React components (Admin, Cart, Common, Product)
    │   ├── context/          # React Context (Cart, Wishlist)
    │   ├── hooks/            # Custom hooks (useProducts, useAdminGuard)
    │   ├── pages/            # Shop and Admin page views
    │   ├── styles/           # Global Tailwind CSS styles
    │   ├── utils/            # API interceptors and helpers
    │   ├── App.jsx           # Main routing shell
    │   └── main.jsx
    ├── index.html
    ├── tailwind.config.js
    └── vercel.json           # Vercel SPA routing config
```

## Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Fill in the credentials in `.env` (PostgreSQL, Razorpay, Gmail SMTP).

### 2. Database Initialization
Ensure you have PostgreSQL running. Create a database:
```sql
CREATE DATABASE vinoz_fashion;
```
Run the migration script to apply schema and seed data:
```bash
npm run migrate
```

### 3. Start Backend
```bash
npm run dev
```
The backend will run on `http://localhost:5000`.

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
```
Set `VITE_API_URL=http://localhost:5000/api` in `.env.local` if not already set.

### 5. Start Frontend
```bash
npm run dev
```
The frontend will run on `http://localhost:3000` (or `5173`).

## Configuration Notes

### Razorpay Setup
To enable webhook notifications for payment capture and failures, add this URL to your Razorpay Webhook settings:
`https://your-backend-url/api/payments/webhook`

Subscribe to these events:
- `payment.captured`
- `payment.failed`

### Gmail SMTP Setup
To send order confirmation emails, you must configure a Gmail App Password:
1. Go to Google Account Security.
2. Enable 2-Step Verification.
3. Search for "App Passwords".
4. Generate a new app password for "Mail".
5. Use the 16-character string as `SMTP_PASS` in your backend `.env`.

### Admin Panel
- **URL**: `/admin`
- **Initial Login**: Use `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your `.env` file (these are injected during migration/seed).
- **Features**: Dashboard stats, full CRUD for products, order status management (with tracking info), return request handling, and coupon generation.

## API Reference

| Method | Path | Auth Req? | Description |
|--------|------|-----------|-------------|
| GET | `/api/products` | No | Get products (with filters & pagination) |
| GET | `/api/products/:slug` | No | Get single product by slug |
| GET | `/api/products/featured/list` | No | Get up to 8 featured products |
| POST | `/api/products` | Yes | Create new product |
| PUT | `/api/products/:id` | Yes | Update product |
| DELETE | `/api/products/:id` | Yes | Delete product |
| POST | `/api/orders` | No | Place a new order |
| GET | `/api/orders/track/:id` | No | Track order by ID and phone |
| GET | `/api/orders` | Yes | Get all orders |
| PATCH | `/api/orders/:id/status` | Yes | Update order status and tracking info |
| POST | `/api/payments/create-order` | No | Create Razorpay order |
| POST | `/api/payments/verify` | No | Verify Razorpay payment signature |
| POST | `/api/payments/webhook` | No | Razorpay webhook listener |
| POST | `/api/coupons/validate` | No | Validate a coupon code |
| GET | `/api/coupons` | Yes | Get all coupons |
| POST | `/api/coupons` | Yes | Create new coupon |
| DELETE | `/api/coupons/:id` | Yes | Delete coupon |
| POST | `/api/returns` | No | Submit a return/exchange request |
| GET | `/api/returns` | Yes | Get all return requests |
| PATCH | `/api/returns/:id` | Yes | Update return request status |
| POST | `/api/admin/login` | No | Admin login (returns JWT) |
| GET | `/api/admin/dashboard` | Yes | Get dashboard statistics |

## Order Flow Diagram

```
[ Cart ] -> (Proceed to Checkout) -> [ Checkout Form ]
                                           |
                              +------------+-------------+
                              |                          |
                        (Pay Online)                   (COD)
                              |                          |
                     [ API: Create Order ]      [ API: Create Order ]
                              |                          |
                  [ API: Create RZP Order ]    (Order Created Successfully)
                              |                          |
                     [ Razorpay Modal ]                  |
                              |                          |
                        (User Pays)                      |
                              |                          |
                   [ API: Verify Signature ]             |
                              |                          |
                    (Email Triggered) <------------------+
                              |
                    [ Order Success Page ]
```

## Features Checklist

| Feature | Status |
|---------|--------|
| Custom pastel UI design | ✅ |
| Product filtering & search | ✅ |
| Shopping cart & Wishlist | ✅ |
| Razorpay Payment Gateway | ✅ |
| Nodemailer Email Notifications | ✅ |
| Order Tracking System | ✅ |
| Returns & Exchanges Form | ✅ |
| Custom Coupon Codes | ✅ |
| Secure Admin Dashboard (JWT) | ✅ |
| PostgreSQL Database Setup | ✅ |
| Fully Responsive (Mobile-first) | ✅ |
