import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart, useWishlist } from '../../context/AppContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop';

export default function ProductCard({ product }) {
  const { cartDispatch } = useCart();
  const { wishlist, wishlistDispatch } = useWishlist();
  const navigate = useNavigate();
  const isWishlisted = wishlist.some(i => i._id === product._id);

  const effectivePrice = product.discountPrice || product.price;
  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    cartDispatch({ type: 'ADD', item: { ...product, _id: product._id || product.id } });
    toast.success('Added to cart! 🛍️');
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    cartDispatch({ type: 'ADD', item: { ...product, _id: product._id || product.id } });
    navigate('/checkout');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    wishlistDispatch({ type: 'TOGGLE', item: product });
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ♥', {
      icon: isWishlisted ? '💔' : '❤️'
    });
  };

  const imageUrl = product.images?.[0]?.url || PLACEHOLDER;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square product-img-zoom bg-blush-50">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => { e.target.src = PLACEHOLDER; }}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discountPct > 0 && (
              <span className="badge bg-blush-600 text-white">{discountPct}% OFF</span>
            )}
            {product.stock === 0 && (
              <span className="badge bg-gray-800 text-white">Sold Out</span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="badge bg-orange-500 text-white">Only {product.stock} left</span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${isWishlisted ? 'bg-blush-500 text-white' : 'bg-white/80 text-gray-400 hover:text-blush-500 hover:bg-white'}`}
          >
            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Action buttons - shows on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex border-t border-gray-100">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-white/90 text-gray-800 py-3 text-xs font-body font-semibold
                         hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                         flex items-center justify-center gap-1.5 transition-colors border-r border-gray-200"
            >
              <ShoppingBag size={14} />
              + Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 bg-blush-600 text-white py-3 text-xs font-body font-semibold
                         hover:bg-blush-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                         flex items-center justify-center transition-colors"
            >
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-blush-400 font-body uppercase tracking-wide mb-0.5 capitalize">
            {product.category?.replace('-', ' ')}
          </p>
          <h3 className="font-body text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.ratings?.count > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-gray-500 font-body">
                {product.ratings.average.toFixed(1)} ({product.ratings.count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-body font-semibold text-blush-700">
              ₹{effectivePrice.toLocaleString('en-IN')}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-gray-400 line-through font-body">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
