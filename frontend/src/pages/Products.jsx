import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import productService from '@/services/product.service';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/hooks/useToast';

const CATEGORIES = ['tws', 'headphones', 'powerbanks', 'smart_watch'];

export const Products = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const buildParams = useCallback(() => {
    const params = { page: currentPage, limit: 12, sort: 'newest' };
    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    return params;
  }, [currentPage, search, category, minPrice, maxPrice]);

  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    setCategory(urlCategory);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const { data, page, totalPages, total } = await productService.getProducts(buildParams());
        setProducts(data);
        setCurrentPage(page);
        setTotalPages(totalPages);
        setTotalProducts(total);
      } catch (err) {
        const msg = err.response?.data?.message || 'Unable to load products.';
        setError(msg);
        addToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [buildParams, addToast]);

  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const handleCategory = (e) => { setCategory(e.target.value); setCurrentPage(1); };
  const handleMinPrice = (e) => { setMinPrice(e.target.value); setCurrentPage(1); };
  const handleMaxPrice = (e) => { setMaxPrice(e.target.value); setCurrentPage(1); };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setCurrentPage(1);
  };

  const hasActiveFilters = search || category || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-slate-100 py-14 px-4">
      <div className="container mx-auto animate-fade-in">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Catalog</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950">Products</h1>
          </div>
          <Link to="/" className="btn btn-secondary w-full max-w-[220px] text-center sm:w-auto transition-all hover:scale-[1.02]">
            Back to Home
          </Link>
        </div>

        <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-soft transition-shadow hover:shadow-lg">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex-1 min-w-[200px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search</span>
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search products..."
                className="form-input mt-1"
              />
            </label>
            <label className="w-[160px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</span>
              <select value={category} onChange={handleCategory} className="form-input mt-1">
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </label>
            <label className="w-[120px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Min price</span>
               <input type="number" min="0" step="0.01" value={minPrice} onChange={handleMinPrice} placeholder="৳0" className="form-input mt-1" />
              </label>
              <label className="w-[120px]">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max price</span>
                <input type="number" min="0" step="0.01" value={maxPrice} onChange={handleMaxPrice} placeholder="৳99999" className="form-input mt-1" />
            </label>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-outline h-[42px] self-end transition-all hover:scale-[1.02]">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {!loading && !error && (
          <p className="mb-6 text-sm text-slate-500">
            {totalProducts} product{totalProducts !== 1 ? 's' : ''}{hasActiveFilters && ' found'}
          </p>
        )}

        {loading ? (
          <Skeleton.ProductGrid count={6} />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : products.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-14 shadow-soft text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-950">No products found</p>
            <p className="mt-2 text-slate-600">Try adjusting your search or filter criteria.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-primary mt-8 inline-flex transition-all hover:scale-[1.02]">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product._id} className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <ProductCard product={product} />
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
