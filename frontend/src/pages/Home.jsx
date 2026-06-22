import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '@/services/product.service';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/Skeleton';
import { ArrowRight, Star, TrendingUp, Headphones, Zap, Shield, Gift, Truck, RotateCcw } from 'lucide-react';

const CATEGORY_ICONS = {
  tws: Headphones,
  headphones: Headphones,
  powerbanks: Zap,
  smart_watch: TrendingUp,
};

const SECTION_COUNT = 4;

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await productService.getProducts({ sort: 'newest', limit: 16 });
        setProducts(data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const featured = products.slice(0, SECTION_COUNT);
  const trending = products.slice(4, 8);
  const newArrivals = products.slice(8, 12);
  const bestSellers = products.slice(12, 16);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="container relative z-10 py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="animate-slide-up">
              <div className="max-w-2xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/80">
                  <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  Premium Electronics in Bangladesh
                </div>
                <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Your Trusted Tech Marketplace
                </h1>
                <p className="text-base text-slate-300 sm:text-lg">
                  Discover the latest gadgets, audio gear, and power accessories at the best prices in Bangladesh.
                  Free delivery on orders over ৳5,000.
                </p>
              </div>
              <div className="mt-8">
                <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-950 shadow-lg shadow-white/20 transition-all hover:scale-[1.03] hover:bg-slate-100">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  {featured.length > 0 ? featured.slice(0, 4).map((p) => (
                    <div key={p._id} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm text-center">
                      <img src={p.image} alt={p.name} className="h-20 w-full object-contain rounded-xl mb-2" />
                      <p className="text-xs text-slate-300 truncate">{p.name}</p>
                    </div>
                  )) : (
                    <>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm text-center">
                        <Zap className="h-8 w-8 mx-auto text-amber-300 mb-2" />
                        <p className="text-xs text-slate-300">Premium Tech</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm text-center">
                        <Headphones className="h-8 w-8 mx-auto text-blue-300 mb-2" />
                        <p className="text-xs text-slate-300">Audio Gear</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm text-center">
                        <Shield className="h-8 w-8 mx-auto text-emerald-300 mb-2" />
                        <p className="text-xs text-slate-300">Warranty</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm text-center">
                        <Gift className="h-8 w-8 mx-auto text-pink-300 mb-2" />
                        <p className="text-xs text-slate-300">Affiliate Rewards</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Categories</p>
            <h2 className="mt-1.5 text-2xl font-semibold text-slate-950">Shop by category</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-soft">
                <Skeleton.Base className="h-10 w-10 rounded-xl mx-auto" />
                <Skeleton.Base className="h-4 w-20 mx-auto mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Star;
              return (
                <Link key={cat} to={`/products?category=${cat}`} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-950 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-950 capitalize">{cat}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured */}
      <section className="bg-slate-100 py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">Featured Products</h2>
            <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <Skeleton.ProductGrid count={4} />
          ) : featured.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              No products available yet. Check back soon.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending */}
      <section className="container py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-950">Trending Now</h2>
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <Skeleton.ProductGrid count={4} />
        ) : trending.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            No trending products right now. Check back soon.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {trending.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      <section className="container py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-950">New Arrivals</h2>
          <Link to="/products?sort=newest" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <Skeleton.ProductGrid count={4} />
        ) : newArrivals.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            No new arrivals yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Best Sellers */}
      <section className="bg-slate-100 py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">Most Popular</h2>
            <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <Skeleton.ProductGrid count={4} />
          ) : bestSellers.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              No best sellers yet. Check back soon.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Affiliate Promotion */}
      <section className="container py-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10">
          <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1 text-xs text-white/80">
                <Gift className="h-3.5 w-3.5 text-amber-300" />
                Affiliate Program
              </div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Earn 2% commission on every sale</h2>
              <p className="max-w-lg text-sm text-slate-300">
                Share your referral link, promote products you love, and earn commission on every purchase made through your link.
              </p>
            </div>
            <Link to="/affiliate" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-950 shadow-lg transition-all hover:scale-[1.03] shrink-0">
              Join Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-t border-slate-200 bg-white py-8">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Free Delivery</p>
                <p className="text-xs text-slate-500">On orders over ৳5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">7-Day Returns</p>
                <p className="text-xs text-slate-500">Easy return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">1 Year Warranty</p>
                <p className="text-xs text-slate-500">On all electronics</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
