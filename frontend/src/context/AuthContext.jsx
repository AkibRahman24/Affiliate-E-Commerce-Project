import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import authService from '@/services/auth.service';
import productService from '@/services/product.service';
import store from '@/store';
import { addItem } from '@/store/cartSlice';

const PENDING_CART_KEY = 'pending_cart_item';

const rehydratePendingCart = async () => {
  try {
    const raw = localStorage.getItem(PENDING_CART_KEY);
    if (!raw) return;
    const { productId, quantity } = JSON.parse(raw);
    if (!productId) return;
    const product = await productService.getProduct(productId);
    if (product) {
      store.dispatch(addItem({ product, quantity: quantity || 1 }));
    }
  } catch {
    // silent — cart item not available
  } finally {
    localStorage.removeItem(PENDING_CART_KEY);
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize user from localStorage
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);

    const handleUnauthorized = () => {
      authService.logout();
      setUser(null);
      setError(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const data = await authService.login(email, password);
      setUser(data.user);
      rehydratePendingCart();
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      setUser(data.user);
      rehydratePendingCart();
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  }, []);

  const updateUser = useCallback((updates) => {
    const storedUser = authService.getCurrentUser();
    const merged = { ...storedUser, ...updates };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = !!user;
  const isAffiliate = user?.role === 'affiliate';
  const isAdmin = user?.role === 'admin';

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    isAffiliate,
    isAdmin,
    setError,
  }), [user, loading, error, login, register, logout, updateUser, setError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
