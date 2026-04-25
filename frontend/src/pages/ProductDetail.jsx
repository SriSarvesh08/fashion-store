import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ZoomIn, Truck, RotateCcw, Star, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useCart, useWishlist } from '../context/AppContext';
import { productsApi, getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const { cartDispatch } = useCart();
  const { wishlist, wishlistDispatch } = useWishlist();
  const navigate = useNavigate();
  const isWishlisted = product && wishlist.some(i => i._id === product._id);

  useEffect(() => {
    setLoading(true);
    productsApi.getBySlug(slug)
      .then(res => {
        setProduct(res.data);
        if (res.data.colors?.length) setSelectedColor(res.data.colors[0]);
        if (res.data.sizes?.length) setSelectedSize(res.data.sizes[0].value);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 font-body">Product not found</p></div>;

  const allImages = product.images?.length ? product.images : [{ url: PLACEHOLDER, alt: product.name }];
  const colorImages = selectedColor ? allImages.filter(img => img.color === selectedColor) : [];
  const images = colorImages.length > 0 ? colorImages : allImages;
  const effectivePrice = product.discountPrice || product.price;
  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    cartDispatch({
      type: 'ADD',
      item: { ...product, _id: product._id, size: selectedSize, color: selectedColor, quantity }
    });
    toast.success('Added to cart! 🛍️');
  };

  const handleBuyNow = () => {
    if (product.sizes?.length && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    cartDispatch({
      type: 'ADD',
      item: { ...product, _id: product._id, size: selectedSize, color: selectedColor, quantity }
    });
    navigate('/checkout');
  };

  const handleWishlist = () => {
    wishlistDispatch({ type: 'TOGGLE', item: product });
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ♥');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-body text-gray-400 mb-6">
        <Link to="/" className="hover:text-blush-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-blush-600">Products</Link>
        <span>/</span>
        <Link to={`/products/${product.category}`} className="hover:text-blush-600 capitalize">{product.category?.replace('-', ' ')}</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* ── Left: Images ─────────────────────────────────────────── */}
        <div>
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-blush-50 mb-3 cursor-zoom-in" onClick={() => setZoomOpen(true)}>
            <img
              src={getImageUrl(images[selectedImg]?.url) || PLACEHOLDER}
              alt={images[selectedImg]?.alt || product.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = PLACEHOLDER; }}
            />
            <button className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-600">
              <ZoomIn size={16} />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setSelectedImg(Math.max(0, selectedImg - 1)); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 text-gray-600 hover:bg-white disabled:opacity-30"
                  disabled={selectedImg === 0}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setSelectedImg(Math.min(images.length - 1, selectedImg + 1)); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 text-gray-600 hover:bg-white disabled:opacity-30"
                  disabled={selectedImg === images.length - 1}>
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={i} onClick={() => setSelectedImg(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors
                  ${selectedImg === i ? 'border-blush-500' : 'border-transparent hover:border-blush-200'}`}>
                <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
              </button>
            ))}
            {product.videoUrl && (
              <a href={product.videoUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 w-16 h-16 rounded-xl bg-blush-100 flex items-center justify-center border-2 border-transparent hover:border-blush-200">
                <Play size={20} className="text-blush-600" />
              </a>
            )}
          </div>
        </div>

        {/* ── Right: Product Info ───────────────────────────────────── */}
        <div>
          <p className="text-xs text-blush-400 font-body uppercase tracking-wider mb-2 capitalize">{product.category?.replace('-', ' ')}</p>
          <h1 className="font-display text-2xl md:text-3xl text-gray-800 mb-3 leading-snug">{product.name}</h1>

          {/* Rating */}
          {product.ratings?.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(product.ratings.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                ))}
              </div>
              <span className="text-sm text-gray-500 font-body">{product.ratings.average} ({product.ratings.count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-5">
            <span className="font-display text-3xl text-blush-700 font-semibold">₹{effectivePrice.toLocaleString('en-IN')}</span>
            {product.discountPrice && (
              <>
                <span className="text-lg text-gray-400 line-through font-body">₹{product.price.toLocaleString('en-IN')}</span>
                <span className="badge bg-green-100 text-green-700">{discountPct}% OFF</span>
              </>
            )}
          </div>

          <p className="text-sm text-gray-600 font-body leading-relaxed mb-6">{product.description}</p>

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-body font-medium text-gray-700 mb-2">Color: <span className="text-blush-600">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(c => (
                  <button key={c} onClick={() => { setSelectedColor(c); setSelectedImg(0); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-body border-2 transition-colors capitalize
                      ${selectedColor === c ? 'border-blush-500 bg-blush-50 text-blush-700' : 'border-gray-200 text-gray-600 hover:border-blush-300'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-body font-medium text-gray-700 mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s.value} onClick={() => setSelectedSize(s.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-body border-2 transition-colors
                      ${selectedSize === s.value ? 'border-blush-500 bg-blush-50 text-blush-700' : 'border-gray-200 text-gray-600 hover:border-blush-300'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-blush-200 rounded-xl overflow-hidden">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2.5 text-gray-500 hover:bg-blush-50 transition-colors">−</button>
              <span className="px-4 py-2.5 text-sm font-body font-medium text-gray-700">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="px-3 py-2.5 text-gray-500 hover:bg-blush-50 transition-colors">+</button>
            </div>
            <span className={`text-sm font-body ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
              {product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left!` : 'In Stock'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={handleAddToCart} disabled={product.stock === 0}
              className="btn-outline flex-1 flex items-center justify-center gap-2 py-3.5 whitespace-nowrap text-sm min-w-[120px]">
              <ShoppingBag size={18} />
              Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5 whitespace-nowrap text-sm min-w-[120px]">
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
            <button onClick={handleWishlist}
              className={`w-[50px] h-[50px] flex-shrink-0 border-2 rounded-xl flex items-center justify-center transition-all mt-0.5
                ${isWishlisted ? 'border-blush-500 bg-blush-50 text-blush-600' : 'border-gray-200 text-gray-400 hover:border-blush-300'}`}>
              <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Delivery info */}
          <div className="bg-blush-50 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-3">
              <Truck size={16} className="text-blush-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-body font-medium text-gray-700">Delivery</p>
                <p className="text-xs text-gray-500 font-body">{product.deliveryTime || '3-5 business days'} • Free above ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw size={16} className="text-blush-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-body font-medium text-gray-700">Returns & Exchange</p>
                <p className="text-xs text-gray-500 font-body">{product.returnPolicy || '7-day easy return & exchange'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setZoomOpen(false)}>
          <img src={getImageUrl(images[selectedImg]?.url) || PLACEHOLDER} alt={product.name} className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30">✕</button>
        </div>
      )}
    </div>
  );
}
