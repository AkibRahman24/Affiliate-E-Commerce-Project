import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCartItems, selectCartTotal } from '@/store/cartSlice';
import CartControls from '@/components/CartControls';
import { formatCurrency } from '@/utils/formatCurrency';

export const Cart = () => {
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);

  return (
    <div className="min-h-screen bg-slate-100 py-14 px-4">
      <div className="container mx-auto animate-fade-in">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Shopping Cart</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950">Your items</h1>
          </div>
          <Link to="/products" className="btn btn-secondary w-full max-w-[220px] text-center sm:w-auto transition-all hover:scale-[1.02]">
            Continue shopping
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
            <p className="mt-2 text-slate-600">Add products to your cart and they will appear here.</p>
            <Link to="/products" className="btn btn-primary mt-8 inline-flex transition-all hover:scale-[1.02]">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="rounded-[2rem] bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img src={item.image} alt={item.name} className="h-32 w-32 rounded-3xl object-cover transition-transform duration-300 hover:scale-105" />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-slate-950">{item.name}</h2>
                      <p className="mt-2 text-slate-600 line-clamp-2">{item.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>Category: {item.category}</span>
                        <span>Price: {formatCurrency(item.price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-950">{formatCurrency(item.price * item.quantity)}</p>
                      <div className="mt-3 flex items-center justify-end">
                        <CartControls item={item} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-[2rem] bg-white p-8 shadow-soft transition-shadow hover:shadow-lg">
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Order summary</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{formatCurrency(total)}</p>
                </div>
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Items</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Estimated delivery</span>
                    <span>3–5 days</span>
                  </div>
                </div>
                <Link to="/checkout" className="btn btn-primary w-full py-3 transition-all hover:scale-[1.02]">
                  Go to checkout
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
