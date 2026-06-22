import React from 'react';
import { Link } from 'react-router-dom';
import AddToCartButton from '@/components/AddToCartButton';
import { formatCurrency } from '@/utils/formatCurrency';

export const ProductCard = ({ product }) => {
  return (
    <article className="group rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:shadow-md">
      <Link to={`/products/${product._id}`} className="block overflow-hidden rounded-t-xl">
        <img src={product.image || '/placeholder.png'} alt={product.name} className="h-48 w-full object-cover transition duration-300 group-hover:scale-105" />
      </Link>
      <div className="p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{product.category}</span>
        <Link to={`/products/${product._id}`}>
          <h3 className="mt-0.5 text-sm font-semibold text-slate-950 leading-snug hover:text-slate-700">{product.name}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-slate-950">{formatCurrency(product.price)}</span>
          <span className="text-[11px] text-slate-400">{product.stock > 0 ? `${product.stock} left` : 'Out of stock'}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <AddToCartButton product={product} className="!rounded-lg !px-3 !py-2 !text-xs !font-semibold" />
          <Link to={`/products/${product._id}`} className="btn !rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5">
            View
          </Link>
        </div>
      </div>
    </article>
  );
};
