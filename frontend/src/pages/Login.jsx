import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Mail, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      const role = data?.user?.role || user?.role;
      const from = location.state?.from?.pathname || (role === 'admin' ? '/admin' : role === 'affiliate' ? '/affiliate/dashboard' : '/products');
      navigate(from);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-16 px-4">
      <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-200/50">
            <ShieldCheck className="h-4 w-4 text-slate-800" />
            Secure access for affiliates and partners
          </div>
          <div className="space-y-4 rounded-[2rem] bg-white p-10 shadow-soft">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Welcome back</p>
              <h1 className="text-4xl font-semibold text-slate-950">Sign in to your account</h1>
              <p className="text-slate-600">Enter your credentials and resume tracking referrals, commissions, and payouts.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-950 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-slate-900">Industry-ready forms</p>
                <p className="mt-2 text-sm text-slate-500">Clean validation and modern input states.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-950 text-white">
                  <UserPlus className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-slate-900">One account, every role</p>
                <p className="mt-2 text-sm text-slate-500">Customers, affiliates, and admins all in one platform.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-10 shadow-soft">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-semibold text-slate-950">Login</h2>
            <p className="text-slate-600">Securely access your dashboard and manage commissions.</p>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {authError && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input pl-11"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input pl-11"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full gap-2"
            >
              {loading ? 'Logging in...' : 'Login'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:flex-row sm:justify-between">
            <p>
              New here?{' '}
              <Link to="/register" className="font-semibold text-slate-950 hover:text-slate-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
