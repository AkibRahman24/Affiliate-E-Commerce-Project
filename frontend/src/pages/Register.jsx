import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '@/services/auth.service';

export const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const isAffiliateRegistration = role === 'affiliate';

  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    bkashNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register({
        ...formState,
        role: isAffiliateRegistration ? 'affiliate' : 'customer',
      });
      if (isAffiliateRegistration) {
        setSubmitted(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register, please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 py-16 px-4">
        <div className="container mx-auto max-w-lg rounded-[2rem] bg-white p-10 shadow-soft text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <svg className="h-8 w-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Application Submitted</h1>
          <p className="mt-3 text-slate-600">
            Your affiliate application has been submitted for review. An administrator will review your account and you will be notified once approved.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-16 px-4">
      <div className="container mx-auto max-w-3xl rounded-[2rem] bg-white p-10 shadow-soft">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Create account</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {isAffiliateRegistration ? 'Become an Affiliate' : 'Register for AffiliateHub'}
          </h1>
          <p className="mt-2 text-slate-600">
            {isAffiliateRegistration
              ? 'Create your affiliate account and start earning 2% commission on every sale.'
              : 'Create your account and start browsing products instantly.'}
          </p>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">First name</span>
              <input
                name="firstName"
                value={formState.firstName}
                onChange={handleChange}
                className="form-input mt-2"
                placeholder="Jane"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Last name</span>
              <input
                name="lastName"
                value={formState.lastName}
                onChange={handleChange}
                className="form-input mt-2"
                placeholder="Doe"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              className="form-input mt-2"
              placeholder="jane@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              value={formState.password}
              onChange={handleChange}
              className="form-input mt-2"
              placeholder="Enter a secure password"
              required
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              bKash Number
              {isAffiliateRegistration && <span className="text-red-500">*</span>}
            </span>
            <input
              name="bkashNumber"
              type="tel"
              value={formState.bkashNumber}
              onChange={handleChange}
              className="form-input mt-2"
              placeholder="01XXXXXXXXX"
              pattern="01\d{9}"
              title="bKash number must start with 01 and be 11 digits long"
              required={isAffiliateRegistration}
            />
            {isAffiliateRegistration && (
              <p className="mt-1.5 text-xs text-slate-500">Required for affiliate payouts</p>
            )}
          </label>

          <button className="btn btn-primary w-full py-3" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-950 hover:text-slate-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};
