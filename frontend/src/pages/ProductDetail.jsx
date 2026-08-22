import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Star, Truck, ShieldCheck, ChevronRight, Ruler } from 'lucide-react';
import { useCart, useWishlist } from '../context/AppContext';
import { productsApi, getImageUrl } from '../utils/api';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const { cartDispatch } = useCart();
  const { wishlist, wishlistDispatch } = useWishlist();


  useEffect(() => {
    setLoading(true);
    productsApi.getBySlug(slug)
      .then(res => {
        setProduct(res.data);
        if (res.data.colors && res.data.colors.length > 0) setSelectedColor(res.data.colors[0]);
        if (res.data.sizes && res.data.sizes.length > 0) setSelectedSize(res.data.sizes[0].value);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  // Adjust selected size if it becomes unavailable in the newly selected color
  // Adjust selected size if it becomes unavailable in the newly selected color
  useEffect(() => {
    if (product?.category === 'dresses' && selectedColor) {
      const activeColorImages = (product.images || []).filter(img => img.color && img.color.toLowerCase() === selectedColor.toLowerCase());
      const sizesMap = new Map();
      activeColorImages.forEach(img => {
        if (img.sizes) {
          if (Array.isArray(img.sizes)) {
            img.sizes.forEach(s => sizesMap.set(s, 10)); // legacy array
          } else {
            Object.entries(img.sizes).forEach(([s, stock]) => {
              sizesMap.set(s, Math.max(sizesMap.get(s) || 0, stock));
            });
          }
        }
      });
      
      const hasStock = sizesMap.size > 0 && sizesMap.get(selectedSize) > 0;
      if (sizesMap.size > 0 && selectedSize && !hasStock) {
        const firstAvail = product.sizes.find(s => sizesMap.get(s.value) > 0);
        setSelectedSize(firstAvail ? firstAvail.value : null);
      }
    }
  }, [selectedColor, product, selectedSize]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!product) return <div className="text-center py-20 text-xl font-display">Product not found.</div>;

  const isWishlisted = wishlist.some(i => i.id === product.id);
  const outOfStock = product.stock <= 0;
  const isDress = product.category === 'dresses';
  const price = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const currentPrice = discountPrice || price;

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      return toast.error('Please select a size');
    }
    if (product.colors?.length > 0 && !selectedColor) {
      return toast.error('Please select a color');
    }
    
    cartDispatch({
      type: 'ADD',
      item: { ...product, size: selectedSize, color: selectedColor, quantity }
    });
    toast.success('Added to cart');
    window.dispatchEvent(new CustomEvent('openCart'));
  };

  const allImages = product.images?.length > 0 ? product.images : [{ url: 'https://via.placeholder.com/600', is_front: true }];
  
  // Get unique colors from images (for color picker based on actual uploaded images)
  const imageColors = [...new Set(allImages.filter(img => img.color).map(img => img.color))];
  // Merge with product-level colors
  const allColors = [...new Set([...(product.colors || []), ...imageColors])];
  
  // Use all images (don't filter by color) so the user can see all variants
  const displayImages = allImages;
  
  // Get the color of the currently selected image
  const currentImageColor = displayImages[selectedImage]?.color || null;

  // Compute color-specific size stock for dresses
  const availableSizesMap = (() => {
    if (!product || product.category !== 'dresses' || !selectedColor) return null;
    const activeColorImages = allImages.filter(img => img.color && img.color.toLowerCase() === selectedColor.toLowerCase());
    const sizesMap = new Map();
    activeColorImages.forEach(img => {
      if (img.sizes) {
        if (Array.isArray(img.sizes)) {
          img.sizes.forEach(s => sizesMap.set(s, 10));
        } else {
          Object.entries(img.sizes).forEach(([s, stock]) => {
            sizesMap.set(s, Math.max(sizesMap.get(s) || 0, stock));
          });
        }
      }
    });
    return sizesMap;
  })();
  
  const hasConfiguredSizesForColor = availableSizesMap && availableSizesMap.size > 0;

  // When user clicks a color button, jump to the first image of that color
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const idx = displayImages.findIndex(img => img.color && img.color.toLowerCase() === color.toLowerCase());
    if (idx !== -1) setSelectedImage(idx);
  };

  // When user clicks a thumbnail, auto-select that image's color
  const handleThumbnailClick = (idx) => {
    setSelectedImage(idx);
    const imgColor = displayImages[idx]?.color;
    if (imgColor) setSelectedColor(imgColor);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-medium">
        <Link to="/" className="hover:text-blush-600">Home</Link>
        <ChevronRight size={14} className="mx-2 opacity-50" />
        <Link to={`/products/${product.category}`} className="hover:text-blush-600 capitalize">
          {product.category.replace('-', ' ')}
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-50" />
        <span className="text-gray-900 truncate max-w-[200px] sm:max-w-md">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Left: Images */}
        <div className="flex flex-col-reverse md:flex-row gap-4 h-fit sticky top-24">
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {displayImages.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className={`shrink-0 w-16 md:w-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-blush-600 p-0.5 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={getImageUrl(img.url)} alt={`Thumbnail ${idx}`} className="w-full h-20 md:h-24 object-cover rounded" />
                {img.color && (
                  <span className={`block text-[10px] text-center py-0.5 font-medium capitalize truncate ${selectedImage === idx ? 'text-blush-600' : 'text-gray-500'}`}>
                    {img.color}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className={`relative flex-1 bg-gray-50 rounded-2xl overflow-hidden ${isDress ? 'aspect-[3/4]' : 'aspect-square'}`}>
            <img 
              src={getImageUrl(displayImages[selectedImage]?.url || displayImages[0].url)} 
              alt={product.name} 
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            {product.stock > 0 && product.stock <= 5 && (
              <span className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow-lg">
                Only {product.stock} left in stock
              </span>
            )}
            {outOfStock && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-gray-900 text-white px-6 py-2 rounded-full font-bold text-lg tracking-wider">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          <div className="mb-6">
            <span className="text-xs font-bold text-blush-600 tracking-widest uppercase mb-2 block">
              {product.category.replace('-', ' ')}
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-gray-900 mb-3 leading-tight">{product.name}</h1>
            
            {product.ratings_count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.floor(product.ratings_average) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.ratings_count} reviews)</span>
              </div>
            )}

            <div className="flex items-end gap-3 mb-6">
              <span className="font-display text-3xl font-bold text-gray-900">₹{currentPrice.toLocaleString('en-IN')}</span>
              {discountPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through mb-1">₹{price.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mb-1">
                    Save {Math.round(((price - discountPrice)/price)*100)}%
                  </span>
                </>
              )}
            </div>
            
            <p className="text-gray-600 leading-relaxed font-body text-[15px]">{product.description}</p>
          </div>

          <div className="w-full h-px bg-gray-100 my-6"></div>

          {/* Colors */}
          {allColors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Color: <span className="text-blush-600 font-medium capitalize">{selectedColor || currentImageColor || '—'}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {allColors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all capitalize ${
                      selectedColor === color 
                        ? 'border-blush-600 bg-blush-50 text-blush-700 shadow-sm' 
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Size</h3>
                {isDress && (
                  <button onClick={() => setShowSizeGuide(true)} className="text-sm text-blush-600 font-medium flex items-center gap-1 hover:underline">
                    <Ruler size={14} /> Size Guide
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => {
                  let stock = null;
                  let isSizeAvailable = true;
                  
                  if (hasConfiguredSizesForColor) {
                    stock = availableSizesMap.get(size.value) || 0;
                    isSizeAvailable = stock > 0;
                  }

                  return (
                    <div key={size.value} className="relative group flex flex-col items-center">
                      <button
                        onClick={() => isSizeAvailable && setSelectedSize(size.value)}
                        disabled={!isSizeAvailable}
                        className={`min-w-[3rem] h-10 px-3 rounded-xl border text-sm font-medium transition-all ${
                          !isSizeAvailable
                            ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                            : selectedSize === size.value 
                              ? 'border-blush-600 bg-blush-600 text-white shadow-md shadow-blush-200' 
                              : 'border-gray-200 text-gray-700 bg-white hover:border-gray-300'
                        }`}
                      >
                        {size.label}
                      </button>
                      
                      {!isSizeAvailable && hasConfiguredSizesForColor && (
                        <span className="absolute -top-7 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Sold Out
                        </span>
                      )}
                      
                      {isSizeAvailable && hasConfiguredSizesForColor && stock <= 5 && (
                        <span className="absolute -top-7 whitespace-nowrap bg-orange-100 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-orange-200">
                          Only {stock} left
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dress Specific Details */}
          {isDress && (
            <div className="bg-blush-50/50 rounded-xl p-4 mb-6 space-y-2 border border-blush-100/50">
              {product.fabric && <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Fabric:</span> <span className="font-medium text-gray-800">{product.fabric}</span></p>}
              {product.fit && <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Fit:</span> <span className="font-medium text-gray-800 capitalize">{product.fit}</span></p>}
              {product.length && <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Length:</span> <span className="font-medium text-gray-800 capitalize">{product.length.replace('-', ' ')}</span></p>}
              {product.model_height && <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Model:</span> <span className="font-medium text-gray-800">Height {product.model_height}</span></p>}
              {product.care_instructions && (
                <div className="pt-2 mt-2 border-t border-blush-100">
                  <span className="text-xs font-bold text-gray-900 uppercase">Care Instructions</span>
                  <p className="text-sm text-gray-600 mt-1">{product.care_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            {!outOfStock && (
              <div className="flex items-center justify-between border border-gray-200 rounded-full px-4 h-14 w-full sm:w-32 bg-white">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-gray-500 hover:text-blush-600 p-2"
                >-</button>
                <span className="font-medium text-gray-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="text-gray-500 hover:text-blush-600 p-2"
                >+</button>
              </div>
            )}
            
            <button 
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`flex-1 h-14 rounded-full font-bold text-lg transition-all ${
                outOfStock 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blush-600 text-white hover:bg-blush-700 shadow-lg shadow-blush-200 active:scale-[0.98]'
              }`}
            >
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <button 
              onClick={() => wishlistDispatch({ type: 'TOGGLE', item: product })}
              className={`h-14 w-14 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                isWishlisted 
                  ? 'border-blush-600 text-blush-600 bg-blush-50' 
                  : 'border-gray-200 text-gray-400 hover:border-blush-200 hover:text-blush-500'
              }`}
            >
              <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Info blocks */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Truck className="text-blush-600 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Delivery</h4>
                <p className="text-xs text-gray-500 mt-0.5">{product.delivery_time || '3-5 Business Days'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <ShieldCheck className="text-blush-600 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Quality</h4>
                <p className="text-xs text-gray-500 mt-0.5">100% Authentic Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSizeGuide(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 p-6 animate-slide-up shadow-2xl">
            <h3 className="font-display text-2xl text-gray-900 mb-4">Dress Size Guide</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-blush-50">
                    <th className="p-3 font-bold text-gray-700 border-b border-blush-100 rounded-tl-lg">Size</th>
                    <th className="p-3 font-bold text-gray-700 border-b border-blush-100">Bust (in)</th>
                    <th className="p-3 font-bold text-gray-700 border-b border-blush-100">Waist (in)</th>
                    <th className="p-3 font-bold text-gray-700 border-b border-blush-100 rounded-tr-lg">Hip (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-3 font-medium">XS</td><td className="p-3">32</td><td className="p-3">26</td><td className="p-3">36</td></tr>
                  <tr className="border-b"><td className="p-3 font-medium">S</td><td className="p-3">34</td><td className="p-3">28</td><td className="p-3">38</td></tr>
                  <tr className="border-b"><td className="p-3 font-medium">M</td><td className="p-3">36</td><td className="p-3">30</td><td className="p-3">40</td></tr>
                  <tr className="border-b"><td className="p-3 font-medium">L</td><td className="p-3">38</td><td className="p-3">32</td><td className="p-3">42</td></tr>
                  <tr><td className="p-3 font-medium">XL</td><td className="p-3">40</td><td className="p-3">34</td><td className="p-3">44</td></tr>
                </tbody>
              </table>
            </div>
            <button onClick={() => setShowSizeGuide(false)} className="mt-6 w-full btn-outline py-2">Close Guide</button>
          </div>
        </div>
      )}
    </div>
  );
}
