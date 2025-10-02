import { db } from './db';
import { Product, Transaction, User } from '@/types';

interface SyncResult {
  success: boolean;
  message: string;
  syncedAt?: string;
}

export class SyncManager {
  private static API_URL = import.meta.env.VITE_API_URL || '';

  static async pullFromCloud(user: User, storeId?: string): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.API_URL}/api/sync/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          lastSyncAt: user.lastSyncAt || null,
          storeId: storeId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to pull data');
      }

      const data = await response.json();
      
      for (const product of data.products || []) {
        await db.saveProduct(product);
      }

      for (const transaction of data.transactions || []) {
        await db.saveTransaction(transaction);
      }

      return {
        success: true,
        message: `Pulled ${data.products.length} products and ${data.transactions.length} transactions`,
        syncedAt: data.syncedAt,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to pull data from cloud',
      };
    }
  }

  static async pushToCloud(user: User, storeId?: string): Promise<SyncResult> {
    try {
      const products = await db.getProducts();
      const transactions = await db.getTransactions();

      const response = await fetch(`${this.API_URL}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          products,
          transactions,
          storeId: storeId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to push data');
      }

      const data = await response.json();
      
      return {
        success: true,
        message: `Synced ${data.results.productsCreated + data.results.productsUpdated} products and ${data.results.transactionsCreated} transactions`,
        syncedAt: data.syncedAt,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to push data to cloud',
      };
    }
  }

  static async bidirectionalSync(user: User, storeId?: string): Promise<SyncResult> {
    try {
      const pushResult = await this.pushToCloud(user, storeId);
      if (!pushResult.success) {
        return pushResult;
      }

      const pullResult = await this.pullFromCloud(user, storeId);
      if (!pullResult.success) {
        return pullResult;
      }

      return {
        success: true,
        message: 'Bidirectional sync completed successfully',
        syncedAt: pullResult.syncedAt,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Sync failed',
      };
    }
  }

  static async getStores(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/stores/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      const data = await response.json();
      return data.stores || [];
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      return [];
    }
  }

  static async createStore(userId: string, storeData: any): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/api/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...storeData }),
      });

      if (!response.ok) {
        throw new Error('Failed to create store');
      }

      const data = await response.json();
      return data.store;
    } catch (error) {
      console.error('Failed to create store:', error);
      throw error;
    }
  }
}
