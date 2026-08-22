import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCcw, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { productsApi, getImageUrl } from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/common/Spinner';

const HOME_CATEGORIES = [
  { label: 'Dresses', slug: 'dresses', emoji: '👗', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800' },
  { label: 'Earrings', slug: 'earrings', emoji: '✨', img: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800' },
  { label: 'Necklaces', slug: 'necklaces', emoji: '📿', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800' },
  { label: 'Rings', slug: 'rings', emoji: '💍', img: 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=800' },
  { label: 'Hair Clips', slug: 'hair-clips', emoji: '🎀', img: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800' },
  { label: 'Bangles', slug: 'bangles', emoji: '⭕', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800' },
  { label: 'Chains', slug: 'chains', emoji: '⛓️', img: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800' },
  { label: 'Bracelets', slug: 'bracelets', emoji: '📿', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800' },
];

const TESTIMONIALS = [
  { id: 1, name: "Priya S.", text: "The quality of the earrings is amazing! They look even better in person.", rating: 5 },
  { id: 2, name: "Anita K.", text: "Absolutely in love with my new dress. The fabric and fit are perfect.", rating: 5 },
  { id: 3, name: "Meera R.", text: "Fast shipping and beautiful packaging. Will definitely shop here again.", rating: 5 },
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getFeatured()
      .then(res => setFeaturedProducts(res.data))
      .catch(err => console.error("Failed to load featured products", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=2000&q=80" 
            alt="Vino'z Fashion Boutique Background" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent md:from-white/90 md:via-white/50"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full text-center md:text-left">
          <div className="max-w-xl animate-slide-up">
            <span className="inline-block py-1 px-3 rounded-full bg-blush-100 text-blush-700 text-xs font-bold tracking-widest mb-6 uppercase">
              New Collection 2024
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-gray-900 leading-tight mb-6">
              Adorn Yourself<br />with <span className="text-blush-600 italic">Elegance</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto md:mx-0 font-body">
              Discover our curated collection of premium women's accessories and stunning dresses designed to make you shine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/products" className="btn-primary flex items-center justify-center gap-2 text-lg px-8">
                Shop Now <ArrowRight size={18} />
              </Link>
              <a href="#featured" className="btn-outline flex items-center justify-center text-lg px-8">
                Featured Picks
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-blush-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-white/20">
            <div className="flex flex-col items-center px-4">
              <Truck size={24} className="mb-2 opacity-90" />
              <h4 className="font-display text-base mb-0.5">Free Shipping</h4>
              <p className="text-blush-100 text-xs font-body">On orders above ₹500</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <RefreshCcw size={24} className="mb-2 opacity-90" />
              <h4 className="font-display text-base mb-0.5">100% Authentic</h4>
              <p className="text-blush-100 text-xs font-body">Genuine products</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <ShieldCheck size={24} className="mb-2 opacity-90" />
              <h4 className="font-display text-base mb-0.5">Secure Payment</h4>
              <p className="text-blush-100 text-xs font-body">100% secure checkout</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <Sparkles size={24} className="mb-2 opacity-90" />
              <h4 className="font-display text-base mb-0.5">Quality Assured</h4>
              <p className="text-blush-100 text-xs font-body">Premium materials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="section-title">Shop by Category</h2>
          <p className="text-gray-500 mb-12">Find exactly what you're looking for</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {HOME_CATEGORIES.map(cat => (
              <Link key={cat.slug} to={`/products/${cat.slug}`} className="group relative rounded-2xl overflow-hidden aspect-square shadow-sm hover:shadow-xl transition-all duration-300">
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                  <span className="text-3xl mb-2 filter drop-shadow-md transform group-hover:-translate-y-2 transition-transform">{cat.emoji}</span>
                  <h3 className="text-white font-display text-xl md:text-2xl tracking-wide">{cat.label}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Featured Picks</h2>
            <p className="text-gray-500">Handpicked favorites just for you</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse flex flex-col gap-4">
                  <div className="bg-gray-200 aspect-[3/4] rounded-2xl"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-6">
              {featuredProducts.slice(0, 8).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
             <div className="text-center py-10 text-gray-500">No featured products right now.</div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/products" className="btn-outline inline-block">View All Products</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-blush-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="text-gray-500 mb-12">Don't just take our word for it</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.id} className="card p-8 text-left bg-white">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="text-gray-700 italic mb-6">"{t.text}"</p>
                <p className="font-display font-bold text-gray-900">- {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-blush-500 to-blush-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl mb-4">Waiting for your beautiful items?</h2>
          <p className="text-blush-100 mb-8 max-w-xl mx-auto">Track your order instantly using your Order ID and phone number.</p>
          <Link to="/track-order" className="bg-white text-blush-700 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors inline-block shadow-lg">
            Track Your Order
          </Link>
        </div>
      </section>
    </div>
  );
}
