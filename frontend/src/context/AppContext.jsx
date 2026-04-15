import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);
const WishlistContext = createContext(null);

// ─── Cart Reducer ─────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(
        i => i._id === action.item._id && i.size === action.item.size && i.color === action.item.color
      );
      if (existing) {
        return state.map(i =>
          i._id === action.item._id && i.size === action.item.size && i.color === action.item.color
            ? { ...i, quantity: i.quantity + (action.item.quantity || 1) }
            : i
        );
      }
      return [...state, { ...action.item, quantity: action.item.quantity || 1 }];
    }
    case 'REMOVE':
      return state.filter(i => !(i._id === action.id && i.size === action.size && i.color === action.color));
    case 'UPDATE_QTY':
      return state.map(i =>
        i._id === action.id && i.size === action.size && i.color === action.color
          ? { ...i, quantity: Math.max(1, action.quantity) }
          : i
      );
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

// ─── Wishlist Reducer ──────────────────────────────────────────────────────
function wishlistReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE':
      return state.find(i => i._id === action.item._id)
        ? state.filter(i => i._id !== action.item._id)
        : [...state, action.item];
    default:
      return state;
  }
}

function loadFromStorage(key, fallback = []) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

export function AppProvider({ children }) {
  const [cart, cartDispatch] = useReducer(cartReducer, [], () => loadFromStorage('vnz_cart'));
  const [wishlist, wishlistDispatch] = useReducer(wishlistReducer, [], () => loadFromStorage('vnz_wishlist'));

  useEffect(() => {
    localStorage.setItem('vnz_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('vnz_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const cartTotal = cart.reduce((sum, i) => sum + (i.discountPrice || i.price) * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const shipping = cartTotal >= 500 ? 0 : 50;
  const grandTotal = cartTotal + shipping;

  return (
    <CartContext.Provider value={{ cart, cartDispatch, cartTotal, cartCount, shipping, grandTotal }}>
      <WishlistContext.Provider value={{ wishlist, wishlistDispatch }}>
        {children}
      </WishlistContext.Provider>
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export const useWishlist = () => useContext(WishlistContext);
