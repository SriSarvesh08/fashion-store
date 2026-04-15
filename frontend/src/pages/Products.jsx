import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { productsApi } from '../utils/api';
import Spinner from '../components/common/Spinner';

const CATEGORIES = [
  { value: 'earrings', label: 'Earrings' },
  { value: 'hair-clips', label: 'Hair Clips' },
  { value: 'bangles', label: 'Bangles' },
  { value: 'chains', label: 'Chains' },
  { value: 'rings', label: 'Rings' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'bracelets', label: 'Bracelets' },
];

const MATERIALS = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'rose-gold', label: 'Rose Gold' },
  { value: 'oxidised', label: 'Oxidised' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'crystal', label: 'Crystal' },
];

const OCCASIONS = ['casual', 'wedding', 'party', 'office', 'festival', 'daily-wear'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export default function Products() {
  const { category: urlCategory } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: urlCategory || '',
    material: '',
    occasion: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    page: 1,
  });

  useEffect(() => {
    setFilters(f => ({ ...f, category: urlCategory || '' }));
  }, [urlCategory]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const search = searchParams.get('search');
      const featured = searchParams.get('featured');
      if (search) params.search = search;
      if (featured) params.featured = featured;
      Object.keys(params).forEach(k => !params[k] && delete params[k]);

      const res = await productsApi.getAll(params);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ category: '', material: '', occasion: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 });
  };

  const activeFilterCount = [filters.category, filters.material, filters.occasion, filters.minPrice, filters.maxPrice]
    .filter(Boolean).length;

  const pageTitle = urlCategory
    ? urlCategory.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : searchParams.get('search')
      ? `Search: "${searchParams.get('search')}"`
      : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-gray-800 capitalize">{pageTitle}</h1>
          <p className="text-sm text-gray-400 font-body mt-1">{pagination.total} products found</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative hidden md:block">
            <select
              value={filters.sort}
              onChange={e => updateFilter('sort', e.target.value)}
              className="input pr-8 text-sm py-2 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 btn-outline text-sm py-2"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blush-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0 animate-slide-in">
            <div className="card p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-body font-semibold text-gray-700">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-blush-500 hover:text-blush-700 font-body flex items-center gap-1">
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-5">
                <p className="text-xs font-body font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
                <div className="space-y-1.5">
                  {CATEGORIES.map(c => (
                    <label key={c.value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        value={c.value}
                        checked={filters.category === c.value}
                        onChange={e => updateFilter('category', e.target.value)}
                        className="accent-blush-600"
                      />
                      <span className="text-sm font-body text-gray-600 group-hover:text-blush-600">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Material */}
              <div className="mb-5">
                <p className="text-xs font-body font-semibold text-gray-500 uppercase tracking-wide mb-2">Material</p>
                <div className="space-y-1.5">
                  {MATERIALS.map(m => (
                    <label key={m.value} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="material"
                        value={m.value}
                        checked={filters.material === m.value}
                        onChange={e => updateFilter('material', e.target.value)}
                        className="accent-blush-600"
                      />
                      <span className="text-sm font-body text-gray-600 group-hover:text-blush-600">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <p className="text-xs font-body font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Range</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={e => updateFilter('minPrice', e.target.value)}
                    className="input text-sm py-1.5 w-1/2"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={e => updateFilter('maxPrice', e.target.value)}
                    className="input text-sm py-1.5 w-1/2"
                  />
                </div>
              </div>

              {/* Occasion */}
              <div>
                <p className="text-xs font-body font-semibold text-gray-500 uppercase tracking-wide mb-2">Occasion</p>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASIONS.map(o => (
                    <button
                      key={o}
                      onClick={() => updateFilter('occasion', filters.occasion === o ? '' : o)}
                      className={`text-xs px-2.5 py-1 rounded-full font-body capitalize transition-colors
                        ${filters.occasion === o ? 'bg-blush-600 text-white' : 'bg-blush-50 text-gray-600 hover:bg-blush-100'}`}
                    >
                      {o.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {/* Mobile sort */}
          <div className="md:hidden mb-4">
            <select
              value={filters.sort}
              onChange={e => updateFilter('sort', e.target.value)}
              className="input text-sm py-2"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-xl text-gray-400 mb-3">No products found</p>
              <p className="text-sm text-gray-400 font-body">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-outline mt-4 text-sm">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${showFilters ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                      className={`w-9 h-9 rounded-full text-sm font-body transition-colors
                        ${pagination.page === i + 1 ? 'bg-blush-600 text-white' : 'bg-white border border-blush-200 text-gray-600 hover:bg-blush-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
