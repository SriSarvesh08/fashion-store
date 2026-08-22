import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { AppProvider } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import ScrollToTop from './components/common/ScrollToTop';
import Spinner from './components/common/Spinner';
import useAdminGuard from './hooks/useAdminGuard';
import { AlertCircle } from 'lucide-react';

// Shop Pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

// Admin Pages & Layout
const AdminSidebar = lazy(() => import('./components/admin/AdminSidebar'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));

// Layouts
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

// 404 Not Found Component
function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={48} />
      </div>
      <h1 className="font-display text-5xl text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 font-medium mb-2">Page Not Found</p>
      <p className="text-gray-500 mb-8 max-w-md">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Return Home</Link>
    </div>
  );
}

// Admin Auth Guard
function AdminGuard({ children }) {
  const { isAuthenticated, isLoading } = useAdminGuard();
  const location = useLocation();
  
  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Spinner size="lg" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return <AdminSidebar>{children}</AdminSidebar>;
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
        <ErrorBoundary>
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

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
          <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
          <Route path="/admin/coupons" element={<AdminGuard><AdminCoupons /></AdminGuard>} />

          {/* Catch All - 404 */}
          <Route path="*" element={<ShopLayout><NotFound /></ShopLayout>} />
        </Routes>
        </ErrorBoundary>
      </Suspense>
    </AppProvider>
  );
}
