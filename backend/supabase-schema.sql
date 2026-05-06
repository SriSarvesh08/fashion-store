-- ============================================================
-- Vino'z Fashion — Supabase PostgreSQL Schema
-- Run this entire file in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ADMINS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  last_login TIMESTAMPTZ,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── PRODUCTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  discount_price NUMERIC CHECK (discount_price >= 0),
  category TEXT NOT NULL CHECK (category IN ('earrings','hair-clips','bangles','chains','rings','necklaces','bracelets','other')),
  material TEXT CHECK (material IN ('gold','silver','rose-gold','oxidised','fabric','beaded','pearl','crystal','other')),
  occasion TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]',
  video_url TEXT,
  worn_image_url TEXT,
  stock INTEGER DEFAULT 100 CHECK (stock >= 0),
  sizes JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  delivery_time TEXT DEFAULT '3-5 business days',
  return_policy TEXT DEFAULT '7-day easy return & exchange',
  ratings_average NUMERIC DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  instagram_reel_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ─── ORDERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  customer JSONB NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  pricing JSONB NOT NULL,
  coupon_code TEXT,
  payment JSONB NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','packed','dispatched','delivered')),
  status_history JSONB DEFAULT '[]',
  tracking JSONB DEFAULT '{}',
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  email_sent JSONB DEFAULT '{"customer": false, "admin": false}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ─── COUPONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value NUMERIC NOT NULL CHECK (value >= 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── RETURNS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id TEXT NOT NULL UNIQUE,
  order_ref UUID REFERENCES orders(id),
  order_id TEXT NOT NULL,
  customer JSONB,
  type TEXT NOT NULL CHECK (type IN ('return','exchange')),
  reason TEXT NOT NULL CHECK (reason IN ('defective','wrong-item','not-as-described','size-issue','changed-mind','other')),
  description TEXT,
  items JSONB DEFAULT '[]',
  exchange_for TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested','under-review','approved','rejected','pickup-scheduled','completed')),
  admin_note TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RPC Functions for Dashboard Aggregations
-- ============================================================

-- Total revenue
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM((pricing->>'total')::numeric), 0) FROM orders;
$$ LANGUAGE sql STABLE;

-- Today's order count
CREATE OR REPLACE FUNCTION get_today_order_count()
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE;
$$ LANGUAGE sql STABLE;

-- Today's revenue
CREATE OR REPLACE FUNCTION get_today_revenue()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM((pricing->>'total')::numeric), 0) FROM orders WHERE created_at >= CURRENT_DATE;
$$ LANGUAGE sql STABLE;

-- Orders by status
CREATE OR REPLACE FUNCTION get_orders_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
  SELECT o.status, COUNT(*) as count FROM orders o GROUP BY o.status;
$$ LANGUAGE sql STABLE;

-- Daily revenue for last 7 days
CREATE OR REPLACE FUNCTION get_daily_revenue(days INTEGER DEFAULT 7)
RETURNS TABLE(date TEXT, revenue NUMERIC, order_count BIGINT) AS $$
  SELECT
    TO_CHAR(created_at, 'YYYY-MM-DD') as date,
    COALESCE(SUM((pricing->>'total')::numeric), 0) as revenue,
    COUNT(*) as order_count
  FROM orders
  WHERE created_at >= (CURRENT_DATE - (days || ' days')::interval)
  GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
  ORDER BY date ASC;
$$ LANGUAGE sql STABLE;

-- Order stats aggregation
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS TABLE(total_revenue NUMERIC, total_orders BIGINT, pending_orders BIGINT) AS $$
  SELECT
    COALESCE(SUM((pricing->>'total')::numeric), 0) as total_revenue,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'confirmed') as pending_orders
  FROM orders;
$$ LANGUAGE sql STABLE;

-- Done! All tables, indexes, and RPC functions created.
