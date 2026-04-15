import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-blush-50 border-t border-blush-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-display text-xl text-blush-700 mb-3">Vino'z <span className="italic">Fashion</span></h2>
            <p className="text-sm text-gray-500 font-body leading-relaxed mb-4">
              Curated women's accessories to elevate your everyday style.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-blush-100 rounded-full flex items-center justify-center text-blush-600 hover:bg-blush-200 transition-colors">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Shop</h4>
            <ul className="space-y-2">
              {['earrings', 'hair-clips', 'bangles', 'chains'].map(c => (
                <li key={c}>
                  <Link to={`/products/${c}`} className="text-sm text-gray-500 hover:text-blush-600 capitalize font-body transition-colors">
                    {c.replace('-', ' ')}
                  </Link>
                </li>
              ))}
              <li><Link to="/products" className="text-sm text-gray-500 hover:text-blush-600 font-body transition-colors">All Products</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-body font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Help</h4>
            <ul className="space-y-2">
              <li><Link to="/track-order" className="text-sm text-gray-500 hover:text-blush-600 font-body transition-colors">Track Order</Link></li>
              <li><Link to="/return-request" className="text-sm text-gray-500 hover:text-blush-600 font-body transition-colors">Returns & Exchange</Link></li>
              <li><a href="#faq" className="text-sm text-gray-500 hover:text-blush-600 font-body transition-colors">FAQ</a></li>
              <li><Link to="/admin/login" className="text-sm text-gray-500 hover:text-blush-600 font-body transition-colors">Admin</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-gray-500 font-body">
                <Phone size={14} className="text-blush-400 flex-shrink-0" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500 font-body">
                <Mail size={14} className="text-blush-400 flex-shrink-0" />
                hello@vinozfashion.com
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-500 font-body">
                <MapPin size={14} className="text-blush-400 flex-shrink-0 mt-0.5" />
                Tamil Nadu, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blush-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 font-body">
            © 2026 Vino'z Fashion. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 font-body flex items-center gap-1">
            Made with <Heart size={11} className="text-blush-400 inline" /> in India
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-gray-400 font-body">Secure payments by</span>
            <span className="text-xs font-semibold text-blush-500 font-body">Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
