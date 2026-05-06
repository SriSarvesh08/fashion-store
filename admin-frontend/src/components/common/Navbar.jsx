import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Menu, X, ChevronDown } from 'lucide-react';
import { useCart, useWishlist } from '../../context/AppContext';

const categories = [
  { label: 'Earrings', slug: 'earrings' },
  { label: 'Hair Clips', slug: 'hair-clips' },
  { label: 'Bangles', slug: 'bangles' },
  { label: 'Chains', slug: 'chains' },
  { label: 'Rings', slug: 'rings' },
  { label: 'Necklaces', slug: 'necklaces' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const { cartCount, cartDispatch } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setSearchOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Expose cart drawer open via custom event
  const openCart = () => {
    window.dispatchEvent(new CustomEvent('openCart'));
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'}`}>
      {/* Top bar */}
      <div className="bg-blush-600 text-white text-center py-1.5 text-xs font-body">
        🚚 Free shipping on orders above ₹500 &nbsp;|&nbsp; 💎 Quality assured accessories
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-display text-xl md:text-2xl text-blush-700 leading-none">
              Vino'z <span className="italic">Fashion</span>
            </h1>
            <p className="text-[9px] tracking-[0.2em] text-blush-400 uppercase font-body">Women's Accessories</p>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-body text-gray-600 hover:text-blush-600 transition-colors">Home</Link>

            <div
              className="relative"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button className="flex items-center gap-1 text-sm font-body text-gray-600 hover:text-blush-600 transition-colors">
                Shop <ChevronDown size={14} />
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 bg-white rounded-xl shadow-lg border border-blush-100 py-2 min-w-[160px] animate-fade-in">
                  <Link to="/products" className="block px-4 py-2 text-sm text-gray-600 hover:text-blush-600 hover:bg-blush-50">All Products</Link>
                  {categories.map(c => (
                    <Link key={c.slug} to={`/products/${c.slug}`} className="block px-4 py-2 text-sm text-gray-600 hover:text-blush-600 hover:bg-blush-50">
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/track-order" className="text-sm font-body text-gray-600 hover:text-blush-600 transition-colors">Track Order</Link>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="text-sm border border-blush-200 rounded-full px-4 py-1.5 w-40 md:w-56 focus:outline-none focus:ring-2 focus:ring-blush-300"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-gray-600 hover:text-blush-600 transition-colors">
                <Search size={20} />
              </button>
            )}

            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-blush-600 transition-colors">
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blush-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-body">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button onClick={openCart} className="relative p-2 text-gray-600 hover:text-blush-600 transition-colors">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blush-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-body">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button className="md:hidden p-2 text-gray-600" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-blush-100 animate-slide-up">
          <div className="px-4 py-4 space-y-1">
            <Link to="/" className="block py-2.5 text-sm font-body text-gray-700 border-b border-gray-50">Home</Link>
            <Link to="/products" className="block py-2.5 text-sm font-body text-gray-700 border-b border-gray-50">All Products</Link>
            {categories.map(c => (
              <Link key={c.slug} to={`/products/${c.slug}`} className="block py-2 text-sm font-body text-gray-500 pl-4 border-b border-gray-50">
                {c.label}
              </Link>
            ))}
            <Link to="/track-order" className="block py-2.5 text-sm font-body text-gray-700 border-b border-gray-50">Track Order</Link>
            <Link to="/wishlist" className="block py-2.5 text-sm font-body text-gray-700">My Wishlist ({wishlist.length})</Link>
          </div>
        </div>
      )}
    </header>
  );
}
