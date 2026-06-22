import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartTotal, clearCart } from '@/store/cartSlice';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useToast } from '@/hooks/useToast';
import orderService from '@/services/order.service';
import { formatCurrency } from '@/utils/formatCurrency';

export const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const { referrerCode, trackedProductId, clearReferrer } = useAffiliate();
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cash_on_delivery',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        items: cartItems.map(({ productId, name, price, quantity }) => ({ productId, name, price, quantity })),
      };
      if (referrerCode) payload.affiliateCode = referrerCode;
      if (trackedProductId) payload.trackedProductId = trackedProductId;
      await orderService.checkout(payload);
      dispatch(clearCart());
      if (referrerCode) clearReferrer();
      addToast('Order placed successfully!', 'success');
      setTimeout(() => navigate('/orders'), 800);
    } catch (err) {
      addToast(err.response?.data?.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-14 px-4">
      <div className="container mx-auto animate-fade-in">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Checkout</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950">Complete your order</h1>
          </div>
          <Link to="/cart" className="btn btn-secondary w-full max-w-[220px] text-center sm:w-auto transition-all hover:scale-[1.02]">
            Back to cart
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-14 shadow-soft text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-950">Your cart is empty</p>
            <p className="mt-2 text-slate-600">Add products to your cart before checking out.</p>
            <Link to="/products" className="btn btn-primary mt-8 inline-flex transition-all hover:scale-[1.02]">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
            <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft transition-shadow hover:shadow-lg">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Shipping details</h2>
                  <p className="mt-2 text-slate-600">Enter where your order should be delivered.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Full name</span>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} className="form-input mt-2 transition-shadow focus:shadow-md" required />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Email</span>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input mt-2 transition-shadow focus:shadow-md" required />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Shipping address</span>
                  <input name="address" value={formData.address} onChange={handleChange} className="form-input mt-2 transition-shadow focus:shadow-md" required />
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">City</span>
                    <input name="city" value={formData.city} onChange={handleChange} className="form-input mt-2 transition-shadow focus:shadow-md" required />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Postal code</span>
                    <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="form-input mt-2 transition-shadow focus:shadow-md" required />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Payment method</span>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="form-input mt-2">
                      <option value="cash_on_delivery">Cash on Delivery</option>
                    </select>
                  </label>
                </div>

                <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100">
                  {submitting ? 'Processing order...' : 'Place order'}
                </button>
              </div>
            </form>

            <aside className="rounded-[2rem] bg-white p-8 shadow-soft transition-shadow hover:shadow-lg">
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Order summary</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">${total.toFixed(2)}</p>
                </div>
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between gap-4 text-sm text-slate-700">
                      <span>{item.quantity}× {item.name}</span>
                      <strong>{formatCurrency(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-slate-600">
                    <span>Tax</span>
                    <span className="text-xs text-slate-400">Calculated at checkout</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-slate-900 font-semibold border-t border-slate-200 pt-3">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
