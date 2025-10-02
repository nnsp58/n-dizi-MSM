import { User, Product, Transaction, CartItem } from '@/types';

const DB_NAME = 'n-dizi-store';
const DB_VERSION = 1;

class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'email' });
        }

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('code', 'code', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
          transactionStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    await this.promisifyRequest(store.put(user));
  }

  async getUser(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const result = await this.promisifyRequest(store.get(email));
    return result || null;
  }

  // Product operations
  async saveProduct(product: Product): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    await this.promisifyRequest(store.put(product));
  }

  async getProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const result = await this.promisifyRequest(store.getAll());
    return result || [];
  }

  async getProductByCode(code: string): Promise<Product | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index('code');
    const result = await this.promisifyRequest(index.get(code));
    return result || null;
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    await this.promisifyRequest(store.delete(id));
  }

  // Transaction operations
  async saveTransaction(transaction: Transaction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const dbTransaction = this.db.transaction(['transactions'], 'readwrite');
    const store = dbTransaction.objectStore('transactions');
    await this.promisifyRequest(store.put(transaction));
  }

  async getTransactions(): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['transactions'], 'readonly');
    const store = transaction.objectStore('transactions');
    const result = await this.promisifyRequest(store.getAll());
    return result || [];
  }

  async getNextInvoiceNumber(): Promise<string> {
    const transactions = await this.getTransactions();
    const maxNumber = transactions.length;
    return `INV${String(maxNumber + 1).padStart(5, '0')}`;
  }

  // Settings operations
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    await this.promisifyRequest(store.put({ key, value }));
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const result = await this.promisifyRequest(store.get(key));
    return result?.value || null;
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DatabaseManager();
