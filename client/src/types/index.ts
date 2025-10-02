export interface User {
  id: string;
  email: string;
  password?: string;
  storeName: string;
  ownerName: string;
  phone?: string;
  address?: string;
  plan: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  gst: number;
  lowStockThreshold?: number;
  expiry?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  todaySales: number;
  totalInvoices: number;
  lowStockItems: number;
}

export interface ReportStats {
  totalSales: number;
  totalTransactions: number;
  averageBill: number;
}

export interface AlertItem {
  id: string;
  type: 'low-stock' | 'expiry';
  product: Product;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ScanResult {
  code: string;
  format: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  time: string;
  storeName: string;
  storeAddress?: string;
  storeContact?: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
}
