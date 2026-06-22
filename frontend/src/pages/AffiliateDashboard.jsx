import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import affiliateService from '@/services/affiliate.service';
import productService from '@/services/product.service';
import authService from '@/services/auth.service';
import { ArrowRight, CheckCircle, DollarSign, Share2, Users, BarChart3, Gift, Shield, Zap, ChevronDown, Globe, Package, Search, Clock } from 'lucide-react';

/* ── Dashboard component (used at /affiliate/dashboard) ── */
const DashboardView = ({ user, addToast }) => {
  const [stats, setStats] = useState(null);
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [linkMode, setLinkMode] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [copied, setCopied] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [commissionsTotalPages, setCommissionsTotalPages] = useState(1);
  const [commissionsLoading, setCommissionsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, linkRes] = await Promise.all([
          affiliateService.getDashboardStats(),
          affiliateService.getReferralLink(),
        ]);
        setStats(statsRes.data);
        setReferralLink(linkRes.data.referralLink);
      } catch {
        addToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  useEffect(() => {
    const loadCommissions = async () => {
      setCommissionsLoading(true);
      try {
        const r = await affiliateService.getCommissions({ page: commissionsPage, limit: 10 });
        setCommissions(r.data);
        setCommissionsTotalPages(r.totalPages);
      } catch {} finally {
        setCommissionsLoading(false);
      }
    };
    loadCommissions();
  }, [commissionsPage]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await productService.getProducts({ search: searchQuery, limit: 10 });
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      addToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeUrl = linkMode === 'global'
    ? referralLink
    : selectedProduct
      ? `${window.location.origin}/products/${selectedProduct._id}?ref=${user?.affiliateCode || ''}`
      : referralLink;

  return (
    <div className="min-h-screen bg-slate-100 py-14 px-4">
      <div className="container mx-auto animate-fade-in">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Affiliate Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-950">Welcome back, {user?.firstName || 'Affiliate'}</h1>
          <p className="mt-3 text-slate-600">View performance, referral links, and commission details.</p>
        </div>

        {loading ? (
          <div className="grid gap-6 xl:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton.StatCard key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-4">
              <article className="rounded-[2rem] bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Pending earnings</p>
                <p className="mt-4 text-3xl font-semibold text-amber-600">{formatCurrency(stats?.pendingAmount || 0)}</p>
              </article>
              <article className="rounded-[2rem] bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Earned earnings</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{formatCurrency(stats?.totalEarnings || 0)}</p>
              </article>
              <article className="rounded-[2rem] bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Approved earnings</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{formatCurrency(stats?.approvedAmount || 0)}</p>
              </article>
              <article className="rounded-[2rem] bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Paid earnings</p>
                <p className="mt-4 text-3xl font-semibold text-emerald-600">{formatCurrency(stats?.paidAmount || 0)}</p>
              </article>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-5">
              <article className="rounded-[2rem] bg-white p-6 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total clicks</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.totalClicks || 0}</p>
              </article>
              <article className="rounded-[2rem] bg-white p-6 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Orders</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.totalOrders || 0}</p>
              </article>
              <article className="rounded-[2rem] bg-white p-6 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Delivered orders</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.deliveredOrders || 0}</p>
              </article>
              <article className="rounded-[2rem] bg-white p-6 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Conversion rate</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.conversionRate ?? 0}%</p>
              </article>
              <article className="rounded-[2rem] bg-white p-6 shadow-soft">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sales revenue</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(stats?.salesRevenue || 0)}</p>
              </article>
            </div>

            <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] bg-white p-8 shadow-soft transition-shadow hover:shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-semibold text-slate-950">Smart Referral Link Generator</h2>
                </div>
                <p className="text-sm text-slate-500">Your affiliate code: <span className="font-semibold text-slate-900">{user?.affiliateCode || 'N/A'}</span></p>

                <div className="mt-5 flex gap-1 rounded-2xl bg-slate-100 p-1">
                  <button
                    onClick={() => { setLinkMode('global'); setSelectedProduct(null); setSearchQuery(''); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      linkMode === 'global' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    Global Link
                  </button>
                  <button
                    onClick={() => setLinkMode('product')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      linkMode === 'product' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    Product Specific
                  </button>
                </div>

                {linkMode === 'product' && (
                  <>
                    <div className="relative mt-5">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    {searchQuery && (
                      <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto">
                        {searchLoading ? (
                          <div className="py-6 text-center text-sm text-slate-400">Searching...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="py-6 text-center text-sm text-slate-400">No products found</div>
                        ) : (
                          searchResults.map((p) => (
                            <button
                              key={p._id}
                              onClick={() => { setSelectedProduct(p); setSearchQuery(''); }}
                              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                                selectedProduct?._id === p._id
                                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {p.image && (
                                <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                                <p className="text-xs text-slate-500">{formatCurrency(p.price)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {selectedProduct && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold text-slate-900">{selectedProduct.name}</p>
                            <p className="text-xs text-slate-500">
                              Price: <span className="font-semibold text-slate-700">{formatCurrency(selectedProduct.price)}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              Commission: <span className="font-semibold text-emerald-600">2% ({formatCurrency(selectedProduct.price * 0.02)})</span>
                            </p>
                          </div>
                          <button
                            onClick={() => addToast(`Affiliate link generated for ${selectedProduct.name}`, 'success')}
                            className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.97]"
                          >
                            Generate Link
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="mt-5 text-sm text-slate-600">
                  {linkMode === 'global'
                    ? 'Share this link with your audience to earn commission on every purchase.'
                    : selectedProduct
                      ? `Promote "${selectedProduct.name}" and earn 2% commission on sales of this product.`
                      : 'Search and select a product above to generate a unique tracking link.'}
                </p>

                <div className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-1 transition-all focus-within:shadow-md">
                  <input
                    type="text"
                    readOnly
                    value={activeUrl || 'Loading...'}
                    className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                  <button
                    onClick={() => handleCopy(activeUrl)}
                    className={`btn shrink-0 transition-all duration-200 ${
                      copied
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 scale-100'
                        : 'btn-primary'
                    } active:scale-[0.95]`}
                  >
                    {copied ? (
                      <span className="flex items-center gap-1.5 animate-scale-spring">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Copied!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                        </svg>
                        Copy
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <div className="rounded-[2rem] bg-white p-8 shadow-soft transition-shadow hover:shadow-lg">
                <h2 className="text-2xl font-semibold text-slate-950">Affiliate resources</h2>
                <ul className="mt-6 space-y-4 text-slate-600">
                  <li className="rounded-3xl border border-slate-200 bg-slate-50 p-5">Track conversions with a single referral link.</li>
                  <li className="rounded-3xl border border-slate-200 bg-slate-50 p-5">Share product pages directly — your code travels with the link.</li>
                  <li className="rounded-3xl border border-slate-200 bg-slate-50 p-5">Review payout history and commission details.</li>
                </ul>
              </div>
            </section>

            {/* Sales Performance & History */}
            <section className="mt-10">
              <h2 className="text-2xl font-semibold text-slate-950 mb-4">Sales performance &amp; history</h2>
              <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden transition-shadow hover:shadow-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Products</th>
                      <th className="px-6 py-4 font-semibold">Order ID</th>
                      <th className="px-6 py-4 font-semibold">Sale Amount</th>
                      <th className="px-6 py-4 font-semibold">Commission Earned</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionsLoading ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Loading...</td></tr>
                    ) : commissions.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No sales yet</td></tr>
                    ) : (
                      commissions.map((c) => {
                        const productNames = c.products?.length > 0
                          ? c.products.join(', ')
                          : c.orderNumber || '—';
                        return (
                          <tr key={c._id} className="border-b border-slate-100 text-slate-700 transition-colors hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td className="px-6 py-4 max-w-[14rem] truncate font-medium" title={productNames}>{productNames}</td>
                            <td className="px-6 py-4 text-xs font-mono">{c.orderNumber || '—'}</td>
                            <td className="px-6 py-4">{formatCurrency(c.orderAmount)}</td>
                            <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(c.commissionAmount)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                c.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                c.status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                c.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {commissionsTotalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    disabled={commissionsPage <= 1}
                    onClick={() => setCommissionsPage(commissionsPage - 1)}
                    className="btn btn-outline"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-500">Page {commissionsPage} of {commissionsTotalPages}</span>
                  <button
                    disabled={commissionsPage >= commissionsTotalPages}
                    onClick={() => setCommissionsPage(commissionsPage + 1)}
                    className="btn btn-outline"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>

            {/* Performance Metrics */}
            <PerformanceMetricsSection addToast={addToast} />

            {/* Payout Section */}
            <PayoutSection stats={stats} addToast={addToast} />

            {/* Payout History */}
            <PayoutHistorySection addToast={addToast} />
          </>
        )}
      </div>
    </div>
  );
};

/* ── Performance Metrics ── */
const PerformanceMetricsSection = ({ addToast }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    affiliateService.getPerformanceMetrics()
      .then((r) => setMetrics(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) return null;

  const cards = [
    { label: 'Total referrals', value: metrics.totalReferrals },
    { label: 'Total commissions', value: metrics.totalCommissions },
    { label: 'Total earnings', value: `৳${Number(metrics.totalEarnings || 0).toLocaleString('en-US')}` },
    { label: 'Conversion rate', value: `${metrics.conversionRate || 0}%` },
    { label: 'Commission rate', value: `${metrics.commissionRate || 2}%` },
  ];

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold text-slate-950 mb-4">Performance metrics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-soft">
            <p className="text-xs uppercase tracking-wider text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{c.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ── Payout Section ── */
const PayoutSection = ({ stats, addToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setRequesting(true);
    try {
      const r = await affiliateService.requestPayout(Number(amount), method);
      addToast(`Payout request submitted: ৳${Number(amount).toLocaleString()}`, 'success');
      setShowForm(false);
      setAmount('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Payout request failed', 'error');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-950">Payouts</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Request Payout'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-[2rem] bg-white p-8 shadow-soft mb-6">
          <h3 className="text-lg font-semibold text-slate-950 mb-2">Request a payout</h3>
          <p className="text-sm text-slate-500 mb-4">Available balance: ৳{Number(stats?.pendingAmount || 0).toLocaleString('en-US')}</p>
          <form onSubmit={handleRequest} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (BDT)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={stats?.pendingAmount || 0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                placeholder="Enter amount"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Payout method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="form-input">
                <option value="bkash">bKash</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <button type="submit" disabled={requesting || !amount || Number(amount) <= 0} className="btn btn-primary">
              {requesting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
};

/* ── Payout History ── */
const PayoutHistorySection = ({ addToast }) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await affiliateService.getPayoutHistory(page, 10);
        setPayouts(r.data);
        setTotalPages(r.totalPages);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  if (loading && payouts.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold text-slate-950 mb-4">Payout history</h2>
      <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Order</th>
              <th className="px-6 py-4 font-semibold">Commission</th>
              <th className="px-6 py-4 font-semibold">Paid</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">No payouts yet</td></tr>
            ) : (
              payouts.map((c) => (
                <tr key={c._id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-6 py-4 text-slate-500">{new Date(c.paidAt || c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="px-6 py-4 text-xs font-mono">{c.orderNumber || '—'}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600">৳{Number(c.commissionAmount || 0).toLocaleString('en-US')}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200">Paid</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-outline">Previous</button>
          <span className="px-4 py-2 text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-outline">Next</button>
        </div>
      )}
    </section>
  );
};

/* ── FAQ Accordion Item ── */
const FAQItem = ({ question, answer, open, onToggle }) => (
  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-200">
    <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
      <span>{question}</span>
      <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && (
      <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
        {answer}
      </div>
    )}
  </div>
);

/* ── Onboarding component (used at /affiliate) ── */
const OnboardingView = () => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [faqOpen, setFaqOpen] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [bkashInput, setBkashInput] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!bkashInput.trim()) return;
    setApplying(true);
    try {
      await authService.applyAffiliate(bkashInput.trim());
      updateUser({ pendingAffiliate: true, bkashNumber: bkashInput.trim() });
      setShowApplyForm(false);
    } catch {} finally {
      setApplying(false);
    }
  };

  const faqs = [
    {
      q: 'How do I become an affiliate?',
      a: 'Simply sign up for a free account and select the "Affiliate" role during registration. Once approved, you\'ll get a unique referral code and link to start promoting products immediately.',
    },
    {
      q: 'How does the 2% commission work?',
      a: 'When someone clicks your referral link and makes a purchase within 30 days, you earn 2% of the total order value. For example, if a customer buys a product worth ৳5,000, you earn ৳100.',
    },
    {
      q: 'How do I track my earnings?',
      a: 'Your affiliate dashboard shows real-time stats including total earnings, pending payouts, and referral activity. You can also view detailed commission history for each transaction.',
    },
    {
      q: 'When do I get paid?',
      a: 'Commissions are approved after the order is delivered and the return period has passed. Payouts are processed monthly for all approved commissions.',
    },
    {
      q: 'Can I promote specific products?',
      a: 'Absolutely! Use the Product Link Generator in your dashboard to create unique, randomized tracking URLs for individual products. When a customer clicks that link, they land directly on the product page and your affiliate code is automatically attached.',
    },
    {
      q: 'Is there a minimum payout threshold?',
      a: 'The minimum payout threshold is ৳500. Once your pending commissions reach this amount, they will be scheduled for payout in the next payment cycle.',
    },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="container relative z-10 py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80">
              <Gift className="h-4 w-4 text-amber-300" />
              NovaTech BD Affiliate Program
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Earn Money by<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Sharing Products You Love</span>
            </h1>
            <p className="text-lg text-slate-300 sm:text-xl max-w-2xl mx-auto">
              Join Bangladesh's fastest-growing affiliate program. Get your unique referral link, share it with your audience, and earn 2% commission on every sale.
            </p>
            <RenderCTA
              user={user}
              isAuthenticated={isAuthenticated}
              showApplyForm={showApplyForm}
              setShowApplyForm={setShowApplyForm}
              bkashInput={bkashInput}
              setBkashInput={setBkashInput}
              handleApply={handleApply}
              applying={applying}
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Benefits</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Why Become an Affiliate?</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: DollarSign, title: '2% Commission', desc: 'Earn 2% on every sale made through your referral link. No caps — the more you sell, the more you earn.' },
            { icon: Share2, title: 'Easy Sharing', desc: 'Your unique referral link works on every product page. Share via social media, WhatsApp, or your blog.' },
            { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track clicks, conversions, and earnings in real time through your dedicated affiliate dashboard.' },
            { icon: Zap, title: 'Instant Referral Code', desc: 'Get your unique referral code immediately after signing up. Start promoting within minutes.' },
            { icon: Shield, title: 'Reliable Payouts', desc: 'Commissions are tracked automatically. Monthly payouts with full transparency and history.' },
            { icon: Users, title: 'Grow Your Audience', desc: 'Promote premium electronics that your audience will love. Build trust with quality products.' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <article key={i} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{item.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-100 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">How It Works</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Your Referral Link in Action</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Get Your Link', desc: 'Sign up as an affiliate and receive a unique referral link and code that tracks all your referrals.' },
              { step: '02', title: 'Share & Promote', desc: 'Share your link on social media, YouTube, blogs, or with friends. Your code is automatically included in every product link.' },
              { step: '03', title: 'Earn Commission', desc: 'When someone purchases through your link, you earn 2% of the order total. Track everything in your dashboard.' },
            ].map((item, i) => (
              <div key={i} className="relative rounded-[2rem] bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <span className="text-5xl font-bold text-slate-100">{item.step}</span>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Explanation */}
      <section className="container py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Commission</p>
            <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">2% Commission Explained</h2>
            <p className="text-slate-600 leading-relaxed">
              Our affiliate program offers a flat 2% commission on every order referred through your unique link. There are no tier requirements,
              no minimum sales quotas, and no hidden fees. You earn on every qualifying purchase.
            </p>
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Customer orders</span>
                <span className="font-semibold text-slate-900">৳5,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Your commission (2%)</span>
                <span className="font-semibold text-emerald-600">৳100</span>
              </div>
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-sm">
                <span className="text-slate-600">Customer orders</span>
                <span className="font-semibold text-slate-900">৳25,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Your commission (2%)</span>
                <span className="font-semibold text-emerald-600">৳500</span>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-10 text-white shadow-soft">
            <h3 className="text-2xl font-semibold">Start earning today</h3>
            <ul className="mt-6 space-y-4">
              {[
                'No upfront costs — free to join',
                'Instant referral code upon signup',
                'Real-time earnings tracking',
                'Monthly payouts, no minimum hassle',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {!isAuthenticated ? (
                <>
                  <Link to="/register?role=affiliate" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition-all hover:scale-[1.03]">
                    Sign Up Free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10">
                    Login
                  </Link>
                </>
              ) : (
                <Link to="/affiliate/dashboard" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition-all hover:scale-[1.03]">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-100 py-20">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                open={faqOpen === i}
                onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 text-center">
          <div className="absolute top-0 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to Start Earning?</h2>
            <p className="text-lg text-slate-300 max-w-lg mx-auto">
              Join hundreds of affiliates already earning with NovaTech BD. Sign up in minutes and start sharing.
            </p>
            <RenderCTA
              user={user}
              isAuthenticated={isAuthenticated}
              showApplyForm={showApplyForm}
              setShowApplyForm={setShowApplyForm}
              bkashInput={bkashInput}
              setBkashInput={setBkashInput}
              handleApply={handleApply}
              applying={applying}
              variant="dark"
            />
          </div>
        </div>
      </section>
    </main>
  );
};

/* ── Reusable CTA button block ── */
const RenderCTA = ({ user, isAuthenticated, showApplyForm, setShowApplyForm, bkashInput, setBkashInput, handleApply, applying }) => {
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link to="/register?role=affiliate" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-slate-950 shadow-lg shadow-white/20 transition-all hover:scale-[1.03] hover:bg-slate-100">
          Become an Affiliate <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10 hover:border-white/50">
          Sign In
        </Link>
      </div>
    );
  }

  if (user?.role === 'affiliate') {
    return (
      <Link to="/affiliate/dashboard" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-slate-950 shadow-lg shadow-white/20 transition-all hover:scale-[1.03] hover:bg-slate-100">
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  if (user?.pendingAffiliate) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50/90 border border-amber-200/50 px-6 py-3 text-amber-700 font-semibold text-sm">
        <Clock className="h-4 w-4" /> Application Pending — Awaiting Approval
      </div>
    );
  }

  if (showApplyForm) {
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
        <input
          type="text"
          placeholder="Enter your bKash number"
          value={bkashInput}
          onChange={(e) => setBkashInput(e.target.value)}
          className="w-full rounded-full border border-white/30 bg-white/10 px-6 py-3 text-white placeholder:text-white/50 text-sm text-center outline-none focus:border-white/60"
        />
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={applying || !bkashInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying ? 'Submitting...' : 'Submit Application'}
          </button>
          <button
            onClick={() => setShowApplyForm(false)}
            className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white/80 transition-all hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowApplyForm(true)}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-slate-950 shadow-lg shadow-white/20 transition-all hover:scale-[1.03] hover:bg-slate-100"
    >
      Apply for Affiliate Program <ArrowRight className="h-4 w-4" />
    </button>
  );
};

/* ── Main Export: routes between Dashboard and Onboarding ── */
export const AffiliateDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { addToast } = useToast();

  if (location.pathname === '/affiliate/dashboard') {
    return <DashboardView user={user} addToast={addToast} />;
  }

  return <OnboardingView />;
};
