import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, RotateCcw, Shield, Sparkles } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { productsApi } from '../utils/api';
import Spinner from '../components/common/Spinner';

const HERO_BG = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1400&h=700&fit=crop';

const categories = [
  { label: 'Earrings', slug: 'earrings', emoji: '✨', color: 'bg-pink-50', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=300&fit=crop' },
  { label: 'Hair Clips', slug: 'hair-clips', emoji: '🌸', color: 'bg-rose-50', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop' },
  { label: 'Bangles', slug: 'bangles', emoji: '💛', color: 'bg-amber-50', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=300&fit=crop' },
  { label: 'Chains', slug: 'chains', emoji: '💎', color: 'bg-blush-50', img: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=300&h=300&fit=crop' },
];

const testimonials = [
  { name: 'Priya S.', text: 'Absolutely love the earrings! Quality is amazing and delivery was super fast.', rating: 5 },
  { name: 'Meera R.', text: 'The bangles look exactly like the photos. Great packaging too!', rating: 5 },
  { name: 'Ananya K.', text: 'My go-to place for accessories. The hair clips are adorable!', rating: 5 },
];

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹500' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: Shield, title: 'Secure Payment', desc: 'Razorpay protected' },
  { icon: Sparkles, title: 'Quality Assured', desc: 'Handpicked products' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getFeatured()
      .then(res => setFeatured(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blush-900/60 via-blush-800/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-lg">
            <p className="text-blush-200 font-body text-sm uppercase tracking-[0.3em] mb-3 animate-slide-up">
              New Arrivals 2026
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Adorn Yourself<br />
              <span className="italic text-blush-200">with Elegance</span>
            </h1>
            <p className="text-white/80 font-body text-base md:text-lg mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Handpicked accessories that tell your story — earrings, bangles, chains & more.
            </p>
            <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/products" className="btn-primary flex items-center gap-2">
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link to="/products?featured=true" className="bg-white/20 backdrop-blur-sm text-white border border-white/40 px-6 py-3 rounded-full font-body font-medium hover:bg-white/30 transition-all">
                Featured Picks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ────────────────────────────────────────────── */}
      <section className="bg-blush-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 py-2">
                <Icon size={18} className="text-blush-200 flex-shrink-0" />
                <div>
                  <p className="text-sm font-body font-semibold">{title}</p>
                  <p className="text-xs text-blush-200 font-body">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <p className="text-blush-400 text-xs uppercase tracking-[0.3em] font-body mb-2">Browse By</p>
          <h2 className="section-title">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <Link key={cat.slug} to={`/products/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-square shadow-sm hover:shadow-lg transition-all duration-300">
              <img src={cat.img} alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <span className="text-lg">{cat.emoji}</span>
                <p className="font-display text-lg font-semibold">{cat.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-blush-400 text-xs uppercase tracking-[0.3em] font-body mb-2">Handpicked For You</p>
            <h2 className="section-title">Featured Collection</h2>
          </div>
          <Link to="/products?featured=true" className="flex items-center gap-1 text-sm text-blush-600 font-body hover:gap-2 transition-all">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          // Demo placeholder cards when no products in DB yet
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse-soft">
                <div className="aspect-square bg-blush-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-blush-100 rounded w-1/2" />
                  <div className="h-4 bg-blush-100 rounded" />
                  <div className="h-4 bg-blush-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="bg-blush-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-blush-400 text-xs uppercase tracking-[0.3em] font-body mb-2">Happy Customers</p>
            <h2 className="section-title">What They Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-6">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 font-body leading-relaxed mb-4">"{t.text}"</p>
                <p className="font-body font-semibold text-gray-700 text-sm">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-gradient-to-r from-blush-600 to-blush-400 rounded-3xl p-8 md:p-14 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_1px),radial-gradient(circle_at_80%_20%,white_1px,transparent_1px)] bg-[length:40px_40px]" />
          <div className="relative">
            <h2 className="font-display text-2xl md:text-4xl mb-3">Track Your Order</h2>
            <p className="font-body text-blush-100 mb-6">Know exactly where your package is at all times</p>
            <Link to="/track-order" className="bg-white text-blush-700 px-8 py-3 rounded-full font-body font-semibold hover:bg-blush-50 transition-colors inline-block">
              Track Order
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
