import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useWishlist } from '../../context/AppContext';
import { getImageUrl } from '../../utils/api';

export default function ProductCard({ product }) {
  const { wishlist, wishlistDispatch } = useWishlist();
  
  const isWishlisted = wishlist.some(i => i.id === product.id);
  const price = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const currentPrice = discountPrice || price;
  
  const discountPercent = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const outOfStock = product.stock <= 0;
  const isDress = product.category === 'dresses';

  const toggleWishlist = (e) => {
    e.preventDefault();
    wishlistDispatch({ type: 'TOGGLE', item: product });
  };

  const getPrimaryImage = () => {
    if (!product.images || product.images.length === 0) return 'https://via.placeholder.com/400';
    const frontImg = product.images.find(img => img.is_front) || product.images[0];
    return getImageUrl(frontImg.url);
  };

  return (
    <Link to={`/product/${product.slug}`} className="group relative block w-full">
      <div className="card overflow-hidden h-full flex flex-col border border-gray-50 hover:border-blush-100 transition-colors">
        
        {/* Image Box */}
        <div className={`relative product-img-zoom bg-gray-50 overflow-hidden w-full ${isDress ? 'aspect-[3/4]' : 'aspect-square'}`}>
          <img 
            src={getPrimaryImage()} 
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${outOfStock ? 'opacity-70 grayscale-[30%]' : ''}`}
            loading="lazy"
          />
          
          {/* Overlay gradient for better button visibility */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges (Top Left) */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {outOfStock ? (
              <span className="badge bg-gray-800 text-white">Sold Out</span>
            ) : (
              <>
                {discountPercent > 0 && (
                  <span className="badge bg-blush-500 text-white shadow-sm">
                    -{discountPercent}%
                  </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <span className="badge bg-orange-500 text-white shadow-sm">
                    Only {product.stock} left
                  </span>
                )}
                {product.is_featured && (
                  <span className="badge bg-cream-400 text-gray-900 shadow-sm">Hot</span>
                )}
              </>
            )}
          </div>

          {/* Wishlist Button (Top Right) */}
          <button 
            onClick={toggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm transition-all duration-300 transform active:scale-90 ${
              isWishlisted ? 'bg-white/90 text-blush-500' : 'bg-white/50 text-gray-500 hover:bg-white hover:text-blush-500'
            }`}
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} className={isWishlisted ? 'scale-110 transition-transform' : ''} />
          </button>

          {/* Add to Cart Hover Button (Bottom) */}
          <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            {outOfStock ? (
              <button disabled className="w-full bg-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed">
                Out of Stock
              </button>
            ) : (
              <button className="w-full bg-white/95 backdrop-blur text-blush-600 hover:bg-blush-600 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg">
                View Details
              </button>
            )}
          </div>
        </div>

        {/* Content Box */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-1 gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {product.category.replace('-', ' ')}
            </span>
            {product.ratings_count > 0 && (
              <div className="flex items-center text-xs text-gray-500 gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                <Star size={10} className="text-yellow-400" fill="currentColor" />
                <span className="font-medium">{Number(product.ratings_average).toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-gray-800 text-sm md:text-base leading-snug line-clamp-2 mb-2 group-hover:text-blush-600 transition-colors">
            {product.name}
          </h3>

          <div className="mt-auto flex items-end gap-2 pt-2">
            <span className="font-bold text-gray-900">₹{currentPrice.toLocaleString('en-IN')}</span>
            {discountPrice && (
              <span className="text-xs text-gray-400 line-through mb-0.5">₹{price.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
        
      </div>
    </Link>
  );
}
