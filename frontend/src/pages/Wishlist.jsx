import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/AppContext';
import ProductCard from '../components/product/ProductCard';

export default function Wishlist() {
  const { wishlist } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={24} className="text-blush-500" />
        <h1 className="font-display text-2xl md:text-3xl text-gray-800">My Wishlist</h1>
        {wishlist.length > 0 && (
          <span className="bg-blush-100 text-blush-700 text-sm font-body px-2.5 py-0.5 rounded-full">{wishlist.length}</span>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-blush-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-blush-300" />
          </div>
          <p className="font-display text-xl text-gray-400 mb-2">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 font-body mb-6">Save your favourite items here</p>
          <Link to="/products" className="btn-primary flex items-center gap-2">
            Explore Products <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {wishlist.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
