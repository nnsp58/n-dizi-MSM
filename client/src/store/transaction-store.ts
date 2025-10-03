import { create } from 'zustand';
import { Transaction, CartItem, ReportStats } from '@/types';
import { db } from '@/lib/db';

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  
  loadTransactions: () => Promise<void>;
  addTransaction: (items: CartItem[], totals: { subtotal: number; gst: number; total: number }) => Promise<string>;
  getRecentTransactions: (limit?: number) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  getTodaysTransactions: () => Transaction[];
  getTransactionByInvoice: (invoiceNumber: string) => Transaction | undefined;
  getReportStats: (startDate?: Date, endDate?: Date) => ReportStats;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,

  loadTransactions: async () => {
    set({ loading: true });
    try {
      const transactions = await db.getTransactions();
      // Sort by date descending
      transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      set({ transactions, loading: false });
    } catch (error) {
      console.error('Error loading transactions:', error);
      set({ loading: false });
    }
  },

  addTransaction: async (items, totals) => {
    const invoiceNumber = await db.getNextInvoiceNumber();
    
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      invoiceNumber,
      items,
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      createdAt: new Date().toISOString()
    };

    await db.saveTransaction(transaction);
    
    const { transactions } = get();
    set({ transactions: [transaction, ...transactions] });
    
    return invoiceNumber;
  },

  getRecentTransactions: (limit = 5) => {
    const { transactions } = get();
    return transactions.slice(0, limit);
  },

  getTransactionsByDateRange: (startDate, endDate) => {
    const { transactions } = get();
    return transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  },

  getTodaysTransactions: () => {
    const { transactions } = get();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startOfDay && transactionDate < endOfDay;
    });
  },

  getTransactionByInvoice: (invoiceNumber) => {
    const { transactions } = get();
    return transactions.find(t => t.invoiceNumber === invoiceNumber);
  },

  getReportStats: (startDate, endDate) => {
    const { transactions } = get();
    let filteredTransactions = transactions;
    
    if (startDate && endDate) {
      filteredTransactions = get().getTransactionsByDateRange(startDate, endDate);
    } else if (startDate || endDate) {
      const today = new Date();
      const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1);
      const end = endDate || today;
      filteredTransactions = get().getTransactionsByDateRange(start, end);
    }
    
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = filteredTransactions.length;
    const averageBill = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    return {
      totalSales,
      totalTransactions,
      averageBill
    };
  }
}));
