import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addItem } from '@/store/cartSlice';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import productService from '@/services/product.service';
import { Skeleton } from '@/components/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';

const PENDING_CART_KEY = 'pending_cart_item';

export const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const product = await productService.getProduct(id);
        setProduct(product);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load product details.');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addItem({ product, quantity: 1 }));
    if (!isAuthenticated) {
      localStorage.setItem(PENDING_CART_KEY, JSON.stringify({ productId: product._id, quantity: 1 }));
    }
    addToast(`${product.name} added to cart!`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-14 px-4">
      <div className="container mx-auto animate-fade-in">
        <Link to="/products" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900">
          ← Back to products
        </Link>

        {loading ? (
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] bg-white p-8 shadow-soft">
              <Skeleton.Base className="h-[420px] w-full rounded-3xl" />
              <div className="mt-8 space-y-4">
                <Skeleton.Base className="h-8 w-3/4" />
                <Skeleton.Base className="h-6 w-1/4" />
                <Skeleton.Text lines={4} className="mt-4" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-[2rem] bg-white p-8 shadow-soft">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton.Base className="h-4 w-20" />
                      <Skeleton.Base className="h-6 w-24 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <Skeleton.Base className="h-12 w-full rounded-full" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : !product ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Product not found</div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] bg-white p-8 shadow-soft transition-shadow hover:shadow-lg">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <img src={product.image} alt={product.name} className="h-[420px] w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="mt-8 space-y-4">
                <h1 className="text-3xl font-semibold text-slate-950">{product.name}</h1>
                <p className="text-xl font-semibold text-slate-900">{formatCurrency(product.price)}</p>
                <p className="text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] bg-white p-8 shadow-soft transition-shadow hover:shadow-lg">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Category</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{product.category}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Availability</p>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock > 0 ? 'In stock' : 'Sold out'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Stock</p>
                    <span className="text-sm text-slate-700">{product.stock}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary w-full py-3 mt-6 transition-all hover:scale-[1.02]"
                >
                  Add to cart
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
