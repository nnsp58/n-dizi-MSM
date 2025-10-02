import { create } from 'zustand';
import { Product } from '@/types';
import { db } from '@/lib/db';

interface InventoryState {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
  
  loadProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductByCode: (code: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  getExpiringProducts: (days?: number) => Product[];
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  getFilteredProducts: () => Product[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  loading: false,
  searchQuery: '',
  selectedCategory: '',

  loadProducts: async () => {
    set({ loading: true });
    try {
      const products = await db.getProducts();
      set({ products, loading: false });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ loading: false });
    }
  },

  addProduct: async (productData) => {
    const product: Product = {
      ...productData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.saveProduct(product);
    
    const { products } = get();
    set({ products: [...products, product] });
  },

  updateProduct: async (id, updates) => {
    const { products } = get();
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) return;

    const updatedProduct = {
      ...products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.saveProduct(updatedProduct);
    
    const newProducts = [...products];
    newProducts[productIndex] = updatedProduct;
    set({ products: newProducts });
  },

  deleteProduct: async (id) => {
    await db.deleteProduct(id);
    
    const { products } = get();
    set({ products: products.filter(p => p.id !== id) });
  },

  getProductByCode: (code) => {
    const { products } = get();
    return products.find(p => p.code === code);
  },

  getLowStockProducts: () => {
    const { products } = get();
    return products.filter(p => p.quantity <= (p.lowStockThreshold || 0));
  },

  getExpiringProducts: (days = 30) => {
    const { products } = get();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return products.filter(p => {
      if (!p.expiry) return false;
      const expiryDate = new Date(p.expiry);
      return expiryDate <= futureDate && expiryDate >= new Date();
    });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get();
    
    return products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || 
        selectedCategory === 'All Categories' ||
        product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }
}));
