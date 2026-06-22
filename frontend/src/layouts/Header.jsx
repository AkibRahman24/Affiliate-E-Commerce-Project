import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X, LayoutDashboard, UserPlus, LogIn, LogOut } from 'lucide-react';

const ADMIN_TABS = [
  { label: 'Overview', path: '/admin' },
  { label: 'Products', path: '/admin/products' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Commissions', path: '/admin/commissions' },
  { label: 'Analytics', path: '/admin/analytics' },
  { label: 'Payment Batches', path: '/admin/payment-batches' },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, isAffiliate } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">NB</span>
          <span>NovaTech BD</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-700 md:flex">
          <Link to="/" className="rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950">Home</Link>
          {(!isAuthenticated || user?.role !== 'admin') && (
            <Link to="/products" className="rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950">Products</Link>
          )}
          {(!isAuthenticated || user?.role !== 'admin') && (
            <Link to="/cart" className="rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950">Cart</Link>
          )}
          {isAuthenticated && user?.role !== 'admin' && (
            <Link to="/orders" className="rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950">Orders</Link>
          )}
          {!isAuthenticated && (
            <Link to="/affiliate" className="rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950">Affiliate</Link>
          )}
          {isAffiliate && (
            <Link to="/affiliate/dashboard" className="rounded-xl px-3 py-1.5 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}
          {user?.role === 'admin' && (
            <div className="ml-2 flex items-center gap-1 rounded-2xl bg-slate-50 p-1">
              {ADMIN_TABS.map((tab) => {
                const isActive = location.pathname === tab.path || (tab.path === '/admin' && location.pathname === '/admin/overview');
                return (
                  <Link
                    key={tab.label}
                    to={tab.path}
                    className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                      isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Hi, {user?.firstName}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline gap-2 text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/login" className="btn btn-outline gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link to="/register" className="btn btn-primary gap-2">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-slate-50/95 px-4 py-4">
          <div className="flex flex-col gap-3 text-slate-700">
            <Link to="/" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">
              Home
            </Link>
            {(!isAuthenticated || user?.role !== 'admin') && (
              <Link to="/products" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">
                Products
              </Link>
            )}
            {(!isAuthenticated || user?.role !== 'admin') && (
              <Link to="/cart" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">
                Cart
              </Link>
            )}
            {isAuthenticated && user?.role !== 'admin' && (
              <Link to="/orders" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">
                Orders
              </Link>
            )}
            {!isAuthenticated && (
              <Link to="/affiliate" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">
                Affiliate
              </Link>
            )}
            {isAffiliate && (
              <Link to="/affiliate/dashboard" className="block rounded-2xl px-4 py-3 hover:bg-slate-100">
                Affiliate Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <div className="border-t border-slate-200 pt-3 mt-1">
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</p>
                {ADMIN_TABS.map((tab) => {
                  const isActive = location.pathname === tab.path || (tab.path === '/admin' && location.pathname === '/admin/overview');
                  return (
                    <Link
                      key={tab.label}
                      to={tab.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-2xl px-4 py-3 ${
                        isActive ? 'bg-slate-100 font-semibold text-slate-900' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            )}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 hover:bg-slate-50"
              >
                Logout
              </button>
            ) : (
              <div className="space-y-2">
                <Link to="/login" className="block rounded-2xl bg-white px-4 py-3 text-center font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
                  Login
                </Link>
                <Link to="/register" className="block rounded-2xl bg-slate-950 px-4 py-3 text-center font-semibold text-white hover:bg-slate-800">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
