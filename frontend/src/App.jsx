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


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProvider>
  );
}
