import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const shopLinks = [
    { label: 'All Products', path: '/products' },
    { label: 'Dresses', path: '/products/dresses' },
    { label: 'Earrings', path: '/products/earrings' },
    { label: 'Necklaces', path: '/products/necklaces' },
    { label: 'Bangles & Bracelets', path: '/products/bangles' },
    { label: 'Rings', path: '/products/rings' },
    { label: 'Hair Clips', path: '/products/hair-clips' },
  ];

  const helpLinks = [
    { label: 'Track Order', path: '/track-order' },
    { label: 'Shipping Policy', path: '#' },
    { label: 'FAQ', path: '#' },
  ];

  return (
    <footer className="bg-blush-50 pt-16 pb-8 border-t border-blush-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <h2 className="font-display text-2xl text-blush-800 leading-none">
                Vino'z <span className="italic">Fashion</span>
              </h2>
            </Link>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Where Style Meets Elegance. Curated accessories and stunning dresses for the modern woman.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/vinozfashion/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blush-600 shadow-sm hover:bg-blush-600 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-display text-lg text-gray-800 mb-4">Shop</h3>
            <ul className="space-y-3">
              {shopLinks.map(link => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-gray-600 hover:text-blush-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-display text-lg text-gray-800 mb-4">Help</h3>
            <ul className="space-y-3">
              {helpLinks.map(link => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-gray-600 hover:text-blush-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg text-gray-800 mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Phone size={18} className="text-blush-500 mt-0.5 shrink-0" />
                <span>+91 7397056923<br /><span className="text-xs text-gray-500">Mon-Sat, 9AM-6PM</span></span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <Mail size={18} className="text-blush-500 mt-0.5 shrink-0" />
                <a href="mailto:support@vinozfashion.com" className="hover:text-blush-600">vinozfasion@gmail.com</a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin size={18} className="text-blush-500 mt-0.5 shrink-0" />
                <span>Coimbatore<br />Tamil Nadu 600001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-blush-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Vino'z Fashion. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500 font-medium">Made with <span className="text-rose-500">♥</span> in India</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm text-xs text-gray-600 font-medium tracking-wide">
              🔒 Secured by Razorpay
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
