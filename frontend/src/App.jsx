import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import ScrollToTop from './components/common/ScrollToTop';
import Spinner from './components/common/Spinner';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const ReturnRequest = lazy(() => import('./pages/ReturnRequest'));

// Admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminReturns = lazy(() => import('./pages/admin/AdminReturns'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));

function AdminGuard({ children }) {
  const token = localStorage.getItem('vnz_admin_token');
  return token ? children : <Navigate to="/admin/login" replace />;
}

function AdminLayout({ children }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}

function ShopLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <CartDrawer />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ScrollToTop />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { background: '#fff', color: '#444', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
          success: { iconTheme: { primary: '#c9748f', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
        <Routes>
          {/* Shop Routes */}
          <Route path="/" element={<ShopLayout><Home /></ShopLayout>} />
          <Route path="/products" element={<ShopLayout><Products /></ShopLayout>} />
          <Route path="/products/:category" element={<ShopLayout><Products /></ShopLayout>} />
          <Route path="/product/:slug" element={<ShopLayout><ProductDetail /></ShopLayout>} />
          <Route path="/checkout" element={<ShopLayout><Checkout /></ShopLayout>} />
          <Route path="/order-success/:orderId" element={<ShopLayout><OrderSuccess /></ShopLayout>} />
          <Route path="/track-order" element={<ShopLayout><OrderTracking /></ShopLayout>} />
          <Route path="/wishlist" element={<ShopLayout><Wishlist /></ShopLayout>} />
          <Route path="/return-request" element={<ShopLayout><ReturnRequest /></ShopLayout>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLayout><AdminLogin /></AdminLayout>} />
          <Route path="/admin" element={<AdminGuard><AdminLayout><AdminDashboard /></AdminLayout></AdminGuard>} />
          <Route path="/admin/products" element={<AdminGuard><AdminLayout><AdminProducts /></AdminLayout></AdminGuard>} />
          <Route path="/admin/orders" element={<AdminGuard><AdminLayout><AdminOrders /></AdminLayout></AdminGuard>} />
          <Route path="/admin/returns" element={<AdminGuard><AdminLayout><AdminReturns /></AdminLayout></AdminGuard>} />
          <Route path="/admin/coupons" element={<AdminGuard><AdminLayout><AdminCoupons /></AdminLayout></AdminGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProvider>
  );
}
