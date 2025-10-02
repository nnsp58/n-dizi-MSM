import { create } from 'zustand';
import { CartItem, Product } from '@/types';

interface POSState {
  cart: CartItem[];
  searchQuery: string;
  
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; gst: number; total: number };
  setSearchQuery: (query: string) => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  searchQuery: '',

  addToCart: (product, quantity = 1) => {
    const { cart } = get();
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Update existing item
      const newCart = [...cart];
      newCart[existingItemIndex].cartQuantity += quantity;
      set({ cart: newCart });
    } else {
      // Add new item
      const cartItem: CartItem = {
        ...product,
        cartQuantity: quantity
      };
      set({ cart: [...cart, cartItem] });
    }
  },

  removeFromCart: (productId) => {
    const { cart } = get();
    set({ cart: cart.filter(item => item.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    const { cart } = get();
    const newCart = cart.map(item => 
      item.id === productId 
        ? { ...item, cartQuantity: quantity }
        : item
    );
    set({ cart: newCart });
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getCartTotal: () => {
    const { cart } = get();
    
    let subtotal = 0;
    let gstTotal = 0;
    
    cart.forEach(item => {
      const itemTotal = item.price * item.cartQuantity;
      subtotal += itemTotal;
      gstTotal += (itemTotal * item.gst) / 100;
    });
    
    return {
      subtotal,
      gst: gstTotal,
      total: subtotal + gstTotal
    };
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  }
}));
