import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PWAUtils } from '@/lib/pwa-utils';
import { CartItem } from '@/types';

export interface ReturnItem {
  productId: string;
  name: string;
  code: string;
  price: number;
  gst: number;
  quantity: number;
  returnQuantity: number;
}

export interface ReturnRecord {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  returnedItems: ReturnItem[];
  refundAmount: number;
  reason?: string;
  status: 'completed' | 'pending' | 'rejected';
  createdAt: string;
}

interface ReturnsState {
  returns: ReturnRecord[];
  addReturn: (
    transactionId: string,
    invoiceNumber: string,
    returnedItems: ReturnItem[],
    reason?: string
  ) => Promise<string>;
  getReturnsByTransaction: (transactionId: string) => ReturnRecord[];
  getAllReturns: () => ReturnRecord[];
}

export const useReturnsStore = create<ReturnsState>()(
  persist(
    (set, get) => ({
      returns: [],

      addReturn: async (transactionId, invoiceNumber, returnedItems, reason) => {
        const returnId = `RET-${Date.now()}`;
        
        // Calculate refund amount
        const refundAmount = returnedItems.reduce((total, item) => {
          const itemTotal = item.price * item.returnQuantity;
          const gstAmount = (itemTotal * item.gst) / 100;
          return total + itemTotal + gstAmount;
        }, 0);

        const newReturn: ReturnRecord = {
          id: returnId,
          transactionId,
          invoiceNumber,
          returnedItems,
          refundAmount,
          reason,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          returns: [...state.returns, newReturn],
        }));

        return returnId;
      },

      getReturnsByTransaction: (transactionId) => {
        const { returns } = get();
        return returns.filter((r) => r.transactionId === transactionId);
      },

      getAllReturns: () => {
        return get().returns;
      },
    }),
    {
      name: 'returns-storage',
    }
  )
);
