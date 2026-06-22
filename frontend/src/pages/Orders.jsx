import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '@/services/order.service';
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

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const { data, page, totalPages, total } = await orderService.getOrders({ page: currentPage, limit: 5 });
        setOrders(data);
        setCurrentPage(page);
        setTotalPages(totalPages);
        setTotalOrders(total);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-slate-100 py-14 px-4">
      <div className="container mx-auto animate-fade-in">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Orders</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950">Order history</h1>
            {!loading && <p className="mt-2 text-slate-500">{totalOrders} order{totalOrders !== 1 ? 's' : ''}</p>}
          </div>
          <Link to="/products" className="btn btn-secondary w-full max-w-[220px] text-center sm:w-auto transition-all hover:scale-[1.02]">
            Continue shopping
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <Skeleton.OrderCard key={i} />)}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-14 shadow-soft text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-950">No orders yet</p>
            <p className="mt-2 text-slate-600">Place your first order to see it here.</p>
            <Link to="/products" className="btn btn-primary mt-8 inline-flex transition-all hover:scale-[1.02]">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{order.orderNumber}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(order.total)}</p>
                    <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`inline-flex self-start rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wider ${statusStyles[order.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mt-6 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                  {(order.items || []).map((item) => {
                    const product = item.productId || {};
                    const itemName = item.name || product?.name || 'Unavailable Product';
                    const itemImage = item.image || product?.image || '';
                    const itemCategory = item.category || product?.category || '';
                    const imageSrc = itemImage
                      ? (itemImage.startsWith('http') ? itemImage : `${API_ORIGIN}${itemImage}`)
                      : '/placeholder.png';
                    return (
                      <div key={typeof item.productId === 'string' ? item.productId : item.productId?._id || Math.random()} className="flex items-center gap-3 text-sm text-slate-700">
                        <img
                          src={imageSrc}
                          alt={itemName}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="flex flex-1 items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{itemName}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs text-slate-400">{item.quantity}×</span>
                              {itemCategory && (
                                <span className="inline-flex rounded-full border border-slate-200/60 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                  {itemCategory}
                                </span>
                              )}
                            </div>
                          </div>
                          <strong className="shrink-0">{formatCurrency(item.price * item.quantity)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>Shipping: {order.shippingAddress?.city || 'N/A'}</span>
                  <span>Payment: {order.paymentMethod?.replace(/_/g, ' ')}</span>
                  {order.affiliateCode && <span>Affiliate code: {order.affiliateCode}</span>}
                  {order.affiliateCommission?.commissionAmount > 0 && (
                    <span className="font-semibold text-emerald-600">
                      Commission: ৳{Number(order.affiliateCommission.commissionAmount).toLocaleString('en-US')}
                    </span>
                  )}
                  {order.affiliateCommission?.status && (
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      order.affiliateCommission.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      order.affiliateCommission.status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      order.affiliateCommission.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {order.affiliateCommission.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`btn transition-all hover:scale-[1.05] ${currentPage === index + 1 ? 'btn-primary' : 'btn-outline'}`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
