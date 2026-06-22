import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AffiliateProvider } from '@/context/AffiliateContext';
import { ToastProvider } from '@/context/ToastContext';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Products } from '@/pages/Products';
import { ProductDetails } from '@/pages/ProductDetails';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { Orders } from '@/pages/Orders';
import { AffiliateDashboard } from '@/pages/AffiliateDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { NotFound } from '@/pages/NotFound';

const STORAGE_KEY = 'affiliate_referrer';

const decodeToken = (token) => {
  try {
    const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.length % 4 === 0 ? normalized : normalized + '='.repeat(4 - normalized.length % 4);
    const decoded = atob(padded);
    const [productId, affiliateCode] = decoded.split('|');
    return { productId, affiliateCode };
  } catch {
    return null;
  }
};

const TrackRedirect = () => {
  const { token } = useParams();
  const decoded = decodeToken(token);

  if (!decoded) {
    return <Navigate to="/" replace />;
  }

  const { productId, affiliateCode } = decoded;
  localStorage.setItem(STORAGE_KEY, affiliateCode);

  return <Navigate to={`/products/${productId}?ref=${affiliateCode}`} replace />;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AffiliateProvider>
        <ToastProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/track/:token" element={<TrackRedirect />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<ProtectedRoute element={<Checkout />} />} />
            <Route path="/orders" element={<ProtectedRoute element={<Orders />} />} />
            <Route path="/affiliate" element={<AffiliateDashboard />} />
            <Route path="/affiliate/dashboard" element={<ProtectedRoute element={<AffiliateDashboard />} requiredRole="affiliate" />} />
            <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />} />
            <Route path="/admin/:tab" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />} />
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
        </ToastProvider>
        </AffiliateProvider>
      </AuthProvider>
    </Router>
  );
}
