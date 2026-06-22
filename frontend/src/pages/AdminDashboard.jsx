import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '@/services/admin.service';
import productService from '@/services/product.service';
import { Skeleton } from '@/components/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { API_ORIGIN } from '@/services/api';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-slate-50 text-slate-700 border-slate-200',
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const AdminDashboard = () => {
  const { tab } = useParams();
  const navigate = useNavigate();

  const TAB_COMPONENTS = {
    overview: Overview,
    products: Products,
    users: Users,
    orders: Orders,
    commissions: Commissions,
    'payment-batches': PaymentBatches,
    analytics: Analytics,
  };

  const activeTab = (tab || 'overview').toLowerCase();
  const TabComponent = TAB_COMPONENTS[activeTab];

  React.useEffect(() => {
    if (!TabComponent) {
      navigate('/admin', { replace: true });
    }
  }, [TabComponent, navigate]);

  return (
    <div className="min-h-screen bg-slate-100 py-14 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Admin Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-950">Commerce operations</h1>
        </div>

        {TabComponent ? <TabComponent /> : null}
      </div>
    </div>
  );
};

/* ===== OVERVIEW ===== */
const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then((r) => setStats(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton.StatCard key={i} />)}
        </div>
        <section className="mt-10">
          <Skeleton.Base className="h-8 w-40 mb-4" />
          <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => <Skeleton.TableRow key={i} cols={5} />)}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }
  if (!stats) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">Failed to load dashboard</div>;

  const cards = [
    { label: 'Products', value: stats.totalProducts },
    { label: 'Total orders', value: stats.totalOrders },
    { label: 'Affiliates', value: stats.totalAffiliates },
    { label: 'Customers', value: stats.totalCustomers },
    { label: 'Monthly revenue', value: formatCurrency(stats.monthlyRevenue) },
    { label: 'Pending commissions', value: stats.pendingCommissions },
  ];

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <article key={c.label} className="rounded-[2rem] bg-white p-8 shadow-soft border border-slate-100/80 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{c.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{c.value}</p>
          </article>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-slate-950 mb-4">Recent orders</h2>
        <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden transition-shadow hover:shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-6 py-4 font-semibold">Order</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o._id} className="border-b border-slate-100 text-slate-700 transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{o.orderNumber}</td>
                  <td className="px-6 py-4">{o.shippingAddress?.firstName} {o.shippingAddress?.lastName}</td>
                  <td className="px-6 py-4">{formatCurrency(o.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusStyles[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

/* ===== PRODUCTS (Inventory Management) ===== */
const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', image: '', stock: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [stockUpdates, setStockUpdates] = useState({});
  const [updatingStock, setUpdatingStock] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await productService.getProducts({ page, limit: 10 });
      setProducts(r.data);
      setPage(r.page);
      setTotalPages(r.totalPages);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: '', price: '', description: '', image: '', stock: '', category: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, price: p.price, description: p.description, image: p.image, stock: p.stock, category: p.category });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        await productService.updateProduct(editProduct._id, form);
      } else {
        await productService.createProduct(form);
      }
      setShowModal(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productService.deleteProduct(id);
      load();
    } catch {}
  };

  const handleStockUpdate = async (productId) => {
    const delta = stockUpdates[productId];
    if (delta === undefined || delta === '' || Number(delta) === 0) return;
    setUpdatingStock((prev) => ({ ...prev, [productId]: true }));
    try {
      await productService.adjustStock(productId, Number(delta));
      setStockUpdates((prev) => ({ ...prev, [productId]: '' }));
      load();
    } catch {} finally {
      setUpdatingStock((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const stockBadge = (stock) => {
    if (stock <= 0) return 'bg-red-50 text-red-700 border-red-200/60';
    if (stock < 5) return 'bg-amber-50 text-amber-700 border-amber-200/60';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  };

  const stockLabel = (stock) => {
    if (stock <= 0) return 'Out of stock';
    if (stock < 5) return 'Low stock';
    return 'In stock';
  };

  if (loading) return <div className="text-slate-500">Loading products...</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-slate-600">{products.length} products</p>
        <button onClick={openCreate} className="btn btn-primary transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]">Add product</button>
      </div>

      <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Price</th>
              <th className="px-6 py-4 font-semibold">Stock</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Update Stock</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-slate-100 text-slate-700">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image || '/placeholder.png'}
                      alt={p.name}
                      className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                    />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs uppercase tracking-wider text-slate-500">{p.category}</td>
                <td className="px-6 py-4 font-semibold">{formatCurrency(p.price)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${stockBadge(p.stock)}`}>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                      p.stock <= 0 ? 'bg-red-500' : p.stock < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {p.stock} units
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold ${stockBadge(p.stock)}`}>
                    {stockLabel(p.stock)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="+/-"
                      value={stockUpdates[p._id] ?? ''}
                      onChange={(e) => setStockUpdates((prev) => ({ ...prev, [p._id]: e.target.value }))}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={() => handleStockUpdate(p._id)}
                      disabled={updatingStock[p._id] || stockUpdates[p._id] === undefined || stockUpdates[p._id] === ''}
                      className="rounded-lg bg-slate-950 px-3 py-1 text-xs font-semibold text-white transition-all duration-200 hover:bg-slate-800 hover:-translate-y-0.5 active:scale-[0.95] disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {updatingStock[p._id] ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Updating
                        </span>
                      ) : 'Update'}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-sm font-semibold text-slate-600 hover:text-slate-900">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="text-sm font-semibold text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-950 mb-6">{editProduct ? 'Edit product' : 'Add product'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input name="name" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="form-input" required />
                <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="form-input" required />
              </div>
              <input name="category" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-input" required />
              <input name="image" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="form-input" required />
              <textarea name="description" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input" rows={3} required />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===== USERS ===== */
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (roleFilter) params.role = roleFilter;
      const r = await adminService.getUsers(params);
      setUsers(r.data);
      setPage(r.page);
      setTotalPages(r.totalPages);
    } catch {} finally { setLoading(false); }
  }, [page, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u) => {
    try {
      await adminService.updateUser(u._id, { isActive: !u.isActive });
      load();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await adminService.deleteUser(id);
      load();
    } catch {}
  };

  if (loading) return <div className="text-slate-500">Loading users...</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'customer', 'affiliate'].map((r) => (
            <button
              key={r || 'all'}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`rounded-full border px-4 py-1 text-xs font-semibold ${
                roleFilter === r ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Affiliate Status</th>
              <th className="px-6 py-4 font-semibold">Active</th>
              <th className="px-6 py-4 font-semibold">Affiliate code</th>
              <th className="px-6 py-4 font-semibold">bKash</th>
              <th className="px-6 py-4 font-semibold">Earnings</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-100 text-slate-700">
                <td className="px-6 py-4 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  {u.role === 'admin' ? (
                    <span className="inline-block rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">Admin</span>
                  ) : u.pendingAffiliate ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Pending Approval</span>
                      <button
                        onClick={() => { if (window.confirm('Approve this affiliate application?')) adminService.approveAffiliate(u._id).then(load).catch((err) => console.error(err)); }}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white transition-all hover:bg-emerald-700"
                      >Approve</button>
                      <button
                        onClick={() => { if (window.confirm('Reject this affiliate application?')) adminService.rejectAffiliate(u._id).then(load).catch((err) => console.error(err)); }}
                        className="rounded border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 transition-all hover:bg-red-50"
                      >Reject</button>
                    </div>
                  ) : u.role === 'affiliate' ? (
                    <span className="inline-block rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Approved Affiliate</span>
                  ) : (
                    <span className="inline-block rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500">Not Applied</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={u.role === 'admin'}
                    className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                      u.role === 'admin'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : u.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                    title={u.role === 'admin' ? 'Admin accounts cannot be modified' : ''}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-xs font-mono">{u.affiliateCode || '—'}</td>
                <td className="px-6 py-4 text-xs font-mono">{u.bkashNumber || '—'}</td>
                <td className="px-6 py-4">{formatCurrency(u.affiliateProfile?.totalEarnings)}</td>
                <td className="px-6 py-4">
                  {u.role === 'admin' ? (
                    <span className="text-sm font-semibold text-slate-300 cursor-not-allowed" title="Admin accounts cannot be deleted">Delete</span>
                  ) : (
                    <button onClick={() => handleDelete(u._id)} className="text-sm font-semibold text-red-500 hover:text-red-700">Delete</button>
                  )}
                </td>
              </tr>
            ))}
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
    </div>
  );
};

/* ===== ORDERS ===== */
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const r = await adminService.getOrders(params);
      setOrders(r.data);
      setPage(r.page);
      setTotalPages(r.totalPages);
    } catch {} finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await adminService.updateOrderStatus(id, { status });
      load();
    } catch {}
  };

  if (loading) return <div className="text-slate-500">Loading orders...</div>;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full border px-4 py-1 text-xs font-semibold ${
              statusFilter === s ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-6 py-4 font-semibold">Order</th>
              <th className="px-6 py-4 font-semibold">Items</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <React.Fragment key={o._id}>
                <tr
                  onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}
                  className="border-b border-slate-100 text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                          expandedOrder === o._id ? 'rotate-90' : ''
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      <span className="font-medium">{o.orderNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {o.items?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">{o.customerId?.firstName} {o.customerId?.lastName}</td>
                  <td className="px-6 py-4">{formatCurrency(o.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusStyles[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">{o.paymentStatus}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="px-6 py-4">
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) updateStatus(o._id, e.target.value); }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Change</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                </tr>
                {/* Expanded product details row */}
                <tr>
                  <td colSpan={8} className="p-0">
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-out ${
                        expandedOrder === o._id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                          <p className="font-semibold uppercase tracking-wider text-slate-400">Order items</p>
                          {o.affiliateCode && (
                            <>
                              <span className="text-slate-400">|</span>
                              <span className="text-slate-600">Affiliate: <span className="font-semibold text-slate-800">{o.affiliateCode}</span></span>
                            </>
                          )}
                          {o.affiliateCommission?.status && (
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              o.affiliateCommission.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              o.affiliateCommission.status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              o.affiliateCommission.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              Commission: {o.affiliateCommission.status.replace(/_/g, ' ')}
                            </span>
                          )}
                          {o.affiliateCommission?.commissionAmount > 0 && (
                            <span className="text-slate-600">{formatCurrency(o.affiliateCommission.commissionAmount)}</span>
                          )}
                        </div>
                        <div className="grid gap-2">
                          {(o.items || []).map((item, idx) => {
                            const product = item.productId || {};
                            const itemName = item.name || product?.name || 'Product';
                            const itemImage = item.image || product?.image || '';
                            const itemCategory = item.category || product?.category || '';
                            const imageSrc = itemImage
                              ? (itemImage.startsWith('http') ? itemImage : `${API_ORIGIN}${itemImage}`)
                              : '/placeholder.png';
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200/60"
                              >
                                <img
                                  src={imageSrc}
                                  alt={itemName}
                                  className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200"
                                />
                                <div className="flex flex-1 items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                      {itemName}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="inline-flex rounded-full border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        {itemCategory || '—'}
                                      </span>
                                      <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.price)}</p>
                                    <p className="text-[11px] text-slate-400">each</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
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
    </div>
  );
};

/* ===== COMMISSIONS ===== */
const Commissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [topAffiliates, setTopAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const r = await adminService.getCommissions(params);
      setCommissions(r.data);
      setPage(r.page);
      setTotalPages(r.totalPages);
      setSummary(r.summary);
      setMonthlyStats(r.monthlyCommissionStats || []);
      setTopAffiliates(r.topAffiliates || []);
    } catch {} finally { setLoading(false); }
  }, [page, statusFilter, search, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setStatusFilter('');
  };

  const approve = async (id) => {
    try {
      await adminService.approveCommission(id);
      load();
    } catch {}
  };

  const reject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;
    try {
      await adminService.rejectCommission(id, reason);
      load();
    } catch {}
  };

  const commStatusStyles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    scheduled_for_payment: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  if (loading) return <div className="text-slate-500">Loading commissions...</div>;

  return (
    <div>
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] mb-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Pending amount</p>
              <p className="mt-3 text-3xl font-semibold text-amber-700">{formatCurrency(summary?.totalPendingAmount)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Paid amount</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-700">{formatCurrency(summary?.totalPaidAmount)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Total commissions</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{formatCurrency(summary?.totalCommissionAmount)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search order number or affiliate code"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'pending', 'approved', 'scheduled_for_payment', 'paid', 'rejected', 'refunded'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
              statusFilter === s ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-6 py-4 font-semibold">Affiliate</th>
              <th className="px-6 py-4 font-semibold">Code</th>
              <th className="px-6 py-4 font-semibold">Order</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Commission</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c._id} className="border-b border-slate-100 text-slate-700">
                <td className="px-6 py-4 font-medium">{c.affiliateId?.firstName} {c.affiliateId?.lastName}</td>
                <td className="px-6 py-4 text-xs font-mono">{c.affiliateCode}</td>
                <td className="px-6 py-4 text-xs font-mono">{c.orderNumber}</td>
                <td className="px-6 py-4">{formatCurrency(c.orderAmount)}</td>
                <td className="px-6 py-4 font-medium">{formatCurrency(c.commissionAmount)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${commStatusStyles[c.status] || ''}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{formatDate(c.createdAt)}</td>
                <td className="px-6 py-4">
                  {c.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(c._id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Approve</button>
                      <button onClick={() => reject(c._id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Reject</button>
                    </div>
                  )}

                  {c.status === 'approved' && (
                    <div>
                      <button onClick={async () => { try { await adminService.scheduleCommission(c._id); load(); } catch {} }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Schedule Payment</button>
                    </div>
                  )}

                  {c.status === 'scheduled_for_payment' && (
                    <div>
                      <button onClick={async () => { try { await adminService.markCommissionPaid(c._id); load(); } catch {} }} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Mark Paid</button>
                    </div>
                  )}

                  {(c.status === 'paid' || c.status === 'rejected' || c.status === 'refunded') && (
                    <div className="text-xs text-slate-500">No actions</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950 mb-4">Monthly commission stats</h2>
          {monthlyStats.length === 0 ? (
            <p className="text-sm text-slate-500">No commission history found for the selected range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-3 font-semibold">Month</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 text-slate-700">
                      <td className="px-4 py-3 font-medium">{item._id}</td>
                      <td className="px-4 py-3">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-3">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950 mb-4">Top affiliates</h2>
          {topAffiliates.length === 0 ? (
            <p className="text-sm text-slate-500">No affiliate commission data available.</p>
          ) : (
            <div className="space-y-3">
              {topAffiliates.map((affiliate) => (
                <div key={affiliate._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{affiliate.firstName || 'Unknown'} {affiliate.lastName || ''}</p>
                      <p className="text-xs text-slate-500">{affiliate.affiliateCode || affiliate.email || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(affiliate.totalEarned)}</p>
                      <p className="text-xs text-slate-500">{affiliate.count} commissions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-outline">Previous</button>
          <span className="px-4 py-2 text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-outline">Next</button>
        </div>
      )}
    </div>
  );
};

/* ===== PAYMENT BATCHES ===== */
const PaymentBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await adminService.getPaymentBatches({ page, limit: 10 });
      setBatches(r.data);
      setPage(r.page);
      setTotalPages(r.totalPages);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id) => {
    if (!window.confirm('Complete this payment batch? This will mark all included commissions as paid.')) return;
    try {
      await adminService.completePaymentBatch(id);
      load();
    } catch {}
  };

  const openCreate = async () => {
    try {
      const r = await adminService.getCommissions({ limit: 100, status: 'approved' });
      setCommissions(r.data || []);
      setSelectedIds([]);
      setShowCreate(true);
    } catch {}
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) return;
    setCreating(true);
    try {
      await adminService.createPaymentBatch({ commissionIds: selectedIds });
      setShowCreate(false);
      load();
    } catch {} finally { setCreating(false); }
  };

  if (loading) return <div className="text-slate-500">Loading payment batches...</div>;

  const batchStatusStyles = {
    draft: 'bg-slate-50 text-slate-700 border-slate-200',
    pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-slate-600">{batches.length} batches</p>
        <button onClick={openCreate} className="btn btn-primary">Create Batch</button>
      </div>

      <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-6 py-4 font-semibold">Batch #</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold">Commissions</th>
              <th className="px-6 py-4 font-semibold">Affiliates</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Created</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b._id} className="border-b border-slate-100 text-slate-700">
                <td className="px-6 py-4 font-mono text-xs">{b.batchNumber}</td>
                <td className="px-6 py-4 max-w-[200px] truncate">{b.description || '—'}</td>
                <td className="px-6 py-4">{b.commissionIds?.length || 0}</td>
                <td className="px-6 py-4">{b.affiliateCount || 0}</td>
                <td className="px-6 py-4 font-medium">{formatCurrency(b.totalCommissions)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${batchStatusStyles[b.status] || ''}`}>
                    {b.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{formatDate(b.createdAt)}</td>
                <td className="px-6 py-4">
                  {b.status === 'draft' && (
                    <button onClick={() => handleComplete(b._id)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Complete</button>
                  )}
                  {b.status === 'completed' && (
                    <span className="text-xs text-slate-400">Done</span>
                  )}
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">No payment batches yet</td></tr>
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem] bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-slate-950 mb-2">Create Payment Batch</h2>
            <p className="text-sm text-slate-500 mb-6">Select approved commissions to include in this batch.</p>
            {commissions.length === 0 ? (
              <p className="text-slate-400 text-sm">No approved commissions available.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2 font-semibold"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? commissions.map((c) => c._id) : [])} checked={selectedIds.length === commissions.length && commissions.length > 0} /></th>
                    <th className="px-3 py-2 font-semibold">Affiliate</th>
                    <th className="px-3 py-2 font-semibold">Order</th>
                    <th className="px-3 py-2 font-semibold">Amount</th>
                    <th className="px-3 py-2 font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c._id} className="border-b border-slate-100 text-slate-700">
                      <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.includes(c._id)} onChange={() => toggleSelect(c._id)} /></td>
                      <td className="px-3 py-2">{c.affiliateId?.firstName} {c.affiliateId?.lastName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{c.orderNumber}</td>
                      <td className="px-3 py-2">{formatCurrency(c.orderAmount)}</td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(c.commissionAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreate} disabled={creating || selectedIds.length === 0} className="btn btn-primary flex-1">
                {creating ? 'Creating...' : `Create Batch (${selectedIds.length} commissions)`}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===== ANALYTICS ===== */
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAnalytics()
      .then((r) => setData(r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading analytics...</div>;
  if (!data) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">Failed to load analytics</div>;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <SalesSummary summary={data.summary || {}} />

      {/* Orders by status */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-950 mb-4">Orders by status</h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(data.ordersByStatus || []).map((o) => (
            <div key={o._id} className="rounded-2xl bg-white p-6 shadow-soft text-center">
              <p className="text-2xl font-semibold text-slate-950">{o.count}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{o._id}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyTrendChart data={data.revenueByMonth} metric="revenue" title="Monthly Revenue Trend" formatter={formatCurrency} />
        <MonthlyTrendChart data={data.revenueByMonth} metric="count" title="Monthly Order Trend" />
      </div>

      {/* Revenue by month */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-950 mb-4">Monthly revenue</h2>
        <div className="rounded-[2rem] bg-white p-6 shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">Month</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data.revenueByMonth || []).map((r) => (
                <tr key={r._id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-4 py-3 font-medium">{r._id}</td>
                  <td className="px-4 py-3">{r.count}</td>
                  <td className="px-4 py-3">{formatCurrency(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top affiliates */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-950 mb-4">Top affiliates by earnings</h2>
        <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-6 py-4 font-semibold">Affiliate</th>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Commissions</th>
                <th className="px-6 py-4 font-semibold">Total earned</th>
              </tr>
            </thead>
            <tbody>
              {(data.topAffiliates || []).map((a) => (
                <tr key={a._id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-6 py-4 font-medium">{a.firstName} {a.lastName}</td>
                  <td className="px-6 py-4 text-xs font-mono">{a.affiliateCode || '—'}</td>
                  <td className="px-6 py-4">{a.count}</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(a.totalEarned)}</td>
                </tr>
              ))}
              {(data.topAffiliates || []).length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No affiliate earnings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category breakdown */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-950 mb-4">Sales by category</h2>
        <div className="rounded-[2rem] bg-white shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Units sold</th>
                <th className="px-6 py-4 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data.categoryBreakdown || []).map((c) => (
                <tr key={c._id || 'unknown'} className="border-b border-slate-100 text-slate-700">
                  <td className="px-6 py-4 font-medium">{c._id || 'Unknown'}</td>
                  <td className="px-6 py-4">{c.totalSold}</td>
                  <td className="px-6 py-4">{formatCurrency(c.revenue)}</td>
                </tr>
              ))}
              {(data.categoryBreakdown || []).length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No sales data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sales History */}
      <SalesHistorySection />
    </div>
  );
};

/* ===== SALES SUMMARY CARDS ===== */
const SalesSummary = ({ summary = {} }) => {
  const {
    deliveredRevenue = 0,
    pendingRevenue = 0,
    cancelledRevenue = 0,
    deliveredOrders = 0,
    cancelledOrders = 0,
    affiliateCommissionsPaid = 0,
  } = summary;

  return (
    <section>
      <h2 className="text-2xl font-semibold text-slate-950 mb-4">Sales Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-slate-500">Delivered Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{formatCurrency(deliveredRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-slate-500">Pending Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{formatCurrency(pendingRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-slate-500">Cancelled Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(cancelledRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-slate-500">Delivered Orders</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{deliveredOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-slate-500">Cancelled Orders</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{cancelledOrders}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-slate-500">Affiliate Commissions Paid</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-700">{formatCurrency(affiliateCommissionsPaid)}</p>
        </div>
      </div>
    </section>
  );
};

/* ===== MONTHLY TREND CHART ===== */
const MonthlyTrendChart = ({ data, metric, title, formatter }) => {
  if (!data || data.length === 0) return null;
  const values = data.map((d) => d[metric]);
  const max = Math.max(...values, 1);
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-slate-950 mb-4">{title}</h3>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d._id} className="flex items-center gap-3">
            <span className="w-14 text-xs text-slate-500">{d._id}</span>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(d[metric] / max) * 100}%` }} />
            </div>
            <span className="w-20 text-xs font-semibold text-right text-slate-700">
              {formatter ? formatter(d[metric]) : d[metric]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ===== SALES HISTORY ===== */
const SalesHistorySection = () => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [datePreset, setDatePreset] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exporting, setExporting] = useState(false);

  const getDateFilter = useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (datePreset) {
      case 'today':
        return { startDate: new Date(y, m, now.getDate()).toISOString().slice(0, 10) };
      case 'last7':
        return { startDate: new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10) };
      case 'last30':
        return { startDate: new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10) };
      case 'month':
        return { startDate: new Date(y, m, 1).toISOString().slice(0, 10) };
      case 'year':
        return { startDate: new Date(y, 0, 1).toISOString().slice(0, 10) };
      case 'custom':
        return { startDate: customStart, endDate: customEnd };
      default:
        return {};
    }
  }, [datePreset, customStart, customEnd]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.getSalesHistory({ ...getDateFilter(), page, limit: 15 });
      setRows(r.data);
      setTotal(r.total);
      setTotalPages(r.totalPages);
    } catch {} finally { setLoading(false); }
  }, [page, getDateFilter]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await adminService.getSalesHistory({ ...getDateFilter(), exportAll: true });
      const csv = [
        ['Order ID', 'Date', 'Customer', 'Email', 'Products', 'Quantity', 'Total', 'Status', 'Affiliate', 'Commission', 'Revenue Counted'],
        ...r.data.map((o) => [
          o.orderNumber,
          new Date(o.createdAt).toLocaleDateString(),
          `"${(o.customer?.name || 'N/A').replace(/"/g, '""')}"`,
          o.customer?.email || '',
          `"${(o.items || []).map((i) => i.name).join('; ').replace(/"/g, '""')}"`,
          (o.items || []).reduce((s, i) => s + i.quantity, 0),
          o.total,
          o.status,
          o.affiliate?.name || '—',
          o.commission?.amount || 0,
          o.revenueCounted ? 'Yes' : 'No',
        ]),
      ].map((row) => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-history-${datePreset}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { setExporting(false); }
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold text-slate-950">Sales History</h2>
        <button onClick={handleExport} disabled={exporting} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50">
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Date filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { label: 'Today', value: 'today' },
          { label: 'Last 7 Days', value: 'last7' },
          { label: 'Last 30 Days', value: 'last30' },
          { label: 'This Month', value: 'month' },
          { label: 'This Year', value: 'year' },
          { label: 'Custom', value: 'custom' },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => { setDatePreset(p.value); setPage(1); }}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              datePreset === p.value ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        {datePreset === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs" />
            <span className="text-xs text-slate-500">to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs" />
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[2rem] bg-white shadow-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Products</th>
              <th className="px-4 py-3 font-semibold">Qty</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Affiliate</th>
              <th className="px-4 py-3 font-semibold">Commission</th>
              <th className="px-4 py-3 font-semibold">Revenue Counted</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">No orders found</td></tr>
            ) : (
              rows.map((o) => (
                <tr key={o._id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{o.customer?.name || '—'}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-sm" title={(o.items || []).map((i) => i.name).join(', ')}>
                    {(o.items || []).map((i) => i.name).join(', ')}
                  </td>
                  <td className="px-4 py-3">{(o.items || []).reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                      o.status === 'cancelled' || o.status === 'refunded' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{o.affiliate?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">{o.commission ? formatCurrency(o.commission.amount) : '—'}</td>
                  <td className="px-4 py-3">
                    {o.revenueCounted ? (
                      <span className="text-emerald-600 font-semibold text-sm">Yes</span>
                    ) : (
                      <span className="text-slate-400 text-sm">No</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50">Previous</button>
          <span className="px-3 py-1 text-xs text-slate-500">Page {page} of {totalPages} ({total} orders)</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50">Next</button>
        </div>
      )}
    </section>
  );
};
