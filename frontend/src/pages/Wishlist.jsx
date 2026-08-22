import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/AppContext';
import ProductCard from '../components/product/ProductCard';

export default function Wishlist() {
  const { wishlist } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="flex items-center gap-3 mb-10">
        <Heart className="text-blush-600" size={32} />
        <h1 className="font-display text-3xl md:text-4xl text-gray-900">My Wishlist</h1>
        <span className="bg-blush-100 text-blush-700 text-sm px-3 py-1 rounded-full font-medium ml-2">
          {wishlist.length} item{wishlist.length !== 1 && 's'}
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl border border-gray-100 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Heart size={32} className="text-gray-300" />
          </div>
          <h2 className="font-display text-2xl text-gray-800 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6 max-w-md">Keep track of the items you love. Click the heart icon on any product to save it here.</p>
          <Link to="/products" className="btn-primary">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-6">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
