import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import useProducts from '../hooks/useProducts';
import Spinner from '../components/common/Spinner';

const CATEGORIES = [
  { value: 'earrings', label: 'Earrings' },
  { value: 'hair-clips', label: 'Hair Clips' },
  { value: 'bangles', label: 'Bangles' },
  { value: 'chains', label: 'Chains' },
  { value: 'rings', label: 'Rings' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'dresses', label: 'Dresses' }
];

const MATERIALS = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'rose-gold', label: 'Rose Gold' },
  { value: 'oxidised', label: 'Oxidised' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'crystal', label: 'Crystal' }
];

const DRESS_FITS = ['regular', 'slim', 'flared', 'bodycon', 'a-line', 'wrap', 'shift'];
const DRESS_LENGTHS = ['mini', 'midi', 'maxi', 'knee-length', 'ankle-length'];

const SORTS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export default function Products() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    category: category || searchParams.get('category') || '',
    material: searchParams.get('material') || '',
    fabric: searchParams.get('fabric') || '',
    fit: searchParams.get('fit') || '',
    length: searchParams.get('length') || '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || '',
    limit: 24,
    page: 1
  });

  const { products, loading, error } = useProducts(filters);

  // Update filters when URL params change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: category || searchParams.get('category') || '',
      material: searchParams.get('material') || '',
      fabric: searchParams.get('fabric') || '',
      fit: searchParams.get('fit') || '',
      length: searchParams.get('length') || '',
      sort: searchParams.get('sort') || 'newest',
      search: searchParams.get('search') || '',
      page: 1
    }));
  }, [category, searchParams]);

  const handleFilterChange = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 on filter change
    newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-display text-4xl md:text-5xl text-gray-900 mb-4 capitalize">
          {filters.category ? filters.category.replace('-', ' ') : 'All Collection'}
        </h1>
        <p className="text-gray-500 font-body text-lg">
          Discover our curated collection designed to make you shine on every occasion.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* Mobile Sort Only */}
        <div className="lg:hidden flex justify-end items-center w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 z-10 sticky top-16">
          <div className="relative">
            <select 
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="appearance-none bg-transparent font-medium text-gray-800 pr-8 focus:outline-none"
            >
              {SORTS.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>
        </div>

        {/* Main Content Grid */}
        <main className="flex-1 w-full min-w-0">
          
          {/* Desktop Sort */}
          <div className="hidden lg:flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500">
              Showing <span className="font-medium text-gray-900">{products.length}</span> results
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Sort by</span>
              <div className="relative">
                <select 
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pr-10 font-medium text-gray-800 focus:outline-none focus:border-blush-300 focus:ring-1 focus:ring-blush-300 transition-all"
                >
                  {SORTS.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20 min-h-[400px]">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100 min-h-[400px] flex items-center justify-center">
              <p className="font-medium text-lg">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <SlidersHorizontal size={32} className="text-gray-300" />
              </div>
              <h3 className="font-display text-2xl text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">We couldn't find any items matching your current filters. Try removing some filters or searching for something else.</p>
              <button onClick={clearFilters} className="btn-outline">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-6 lg:gap-8 animate-fade-in">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
