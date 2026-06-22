import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white mt-16">
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm text-sm font-bold">NB</span>
              NovaTech BD
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xs">
              Bangladesh's trusted electronics marketplace. Shop premium gadgets with confidence and earn commissions through our affiliate program.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-300 mb-5">Shop</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/products" className="hover:text-white transition-colors duration-200">All Products</Link></li>
              <li><Link to="/products?category=tws" className="hover:text-white transition-colors duration-200">TWS</Link></li>
              <li><Link to="/products?category=headphones" className="hover:text-white transition-colors duration-200">Headphones</Link></li>
              <li><Link to="/products?category=powerbanks" className="hover:text-white transition-colors duration-200">Power Banks</Link></li>
              <li><Link to="/products?category=smart_watch" className="hover:text-white transition-colors duration-200">Smart Watches</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors duration-200">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-300 mb-5">Affiliates</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/affiliate" className="hover:text-white transition-colors duration-200">Join Program</Link></li>
              <li><Link to="/register?role=affiliate" className="hover:text-white transition-colors duration-200">Sign Up as Affiliate</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors duration-200">Affiliate Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-300 mb-5">Support</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><span className="cursor-default">Email: support@novatechbd.com</span></li>
              <li><span className="cursor-default">Phone: +880 1700-000000</span></li>
              <li><span className="cursor-default">Dhaka, Bangladesh</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 border-t border-slate-800 pt-8 flex flex-col items-center gap-4 text-center text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>&copy; {currentYear} NovaTech BD. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/products" className="hover:text-slate-300 transition-colors">Shop</Link>
            <Link to="/affiliate" className="hover:text-slate-300 transition-colors">Affiliates</Link>
            <Link to="/login" className="hover:text-slate-300 transition-colors">Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
