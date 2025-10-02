import { users, stores, products, transactions, settings, type User, type Store, type Product, type Transaction, type Settings, type InsertUser, type InsertStore, type InsertProduct, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, or } from "drizzle-orm";

export interface IStorage {
  getUser(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(email: string, data: Partial<User>): Promise<User | undefined>;
  
  getStores(userId: string): Promise<Store[]>;
  createStore(userId: string, insertStore: InsertStore): Promise<Store>;
  updateStore(id: string, userId: string, data: Partial<Store>): Promise<Store | undefined>;
  deleteStore(id: string, userId: string): Promise<void>;
  
  getProducts(userId: string, storeId?: string): Promise<Product[]>;
  getProductByCode(userId: string, code: string, storeId?: string): Promise<Product | undefined>;
  createProduct(userId: string, insertProduct: InsertProduct & { storeId?: string }): Promise<Product>;
  updateProduct(id: string, userId: string, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string, userId: string): Promise<void>;
  
  getTransactions(userId: string, storeId?: string): Promise<Transaction[]>;
  createTransaction(userId: string, insertTransaction: InsertTransaction): Promise<Transaction>;
  getNextInvoiceNumber(userId: string, storeId?: string): Promise<string>;
  
  getSetting(userId: string, key: string, storeId?: string): Promise<Settings | undefined>;
  saveSetting(userId: string, key: string, value: any, storeId?: string): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(email: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.email, email))
      .returning();
    return user || undefined;
  }

  async getStores(userId: string): Promise<Store[]> {
    return await db
      .select()
      .from(stores)
      .where(eq(stores.userId, userId))
      .orderBy(desc(stores.createdAt));
  }

  async createStore(userId: string, insertStore: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values({ ...insertStore, userId })
      .returning();
    return store;
  }

  async updateStore(id: string, userId: string, data: Partial<Store>): Promise<Store | undefined> {
    const [store] = await db
      .update(stores)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(stores.id, id), eq(stores.userId, userId)))
      .returning();
    return store || undefined;
  }

  async deleteStore(id: string, userId: string): Promise<void> {
    await db
      .delete(stores)
      .where(and(eq(stores.id, id), eq(stores.userId, userId)));
  }

  async getProducts(userId: string, storeId?: string): Promise<Product[]> {
    const conditions = [eq(products.userId, userId)];
    if (storeId) {
      conditions.push(eq(products.storeId, storeId));
    }
    return await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));
  }

  async getProductByCode(userId: string, code: string, storeId?: string): Promise<Product | undefined> {
    const conditions = [eq(products.userId, userId), eq(products.code, code)];
    if (storeId) {
      conditions.push(eq(products.storeId, storeId));
    }
    const [product] = await db
      .select()
      .from(products)
      .where(and(...conditions));
    return product || undefined;
  }

  async createProduct(userId: string, insertProduct: InsertProduct & { storeId?: string }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({ ...insertProduct, userId, storeId: insertProduct.storeId || null })
      .returning();
    return product;
  }

  async updateProduct(id: string, userId: string, data: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string, userId: string): Promise<void> {
    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)));
  }

  async getTransactions(userId: string, storeId?: string): Promise<Transaction[]> {
    const conditions = [eq(transactions.userId, userId)];
    if (storeId) {
      conditions.push(eq(transactions.storeId, storeId));
    }
    return await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(userId: string, insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({ ...insertTransaction, userId, updatedAt: new Date() })
      .returning();
    return transaction;
  }

  async getNextInvoiceNumber(userId: string, storeId?: string): Promise<string> {
    const conditions = [eq(transactions.userId, userId)];
    if (storeId) {
      conditions.push(eq(transactions.storeId, storeId));
    }
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(and(...conditions));
    const maxNumber = userTransactions.length;
    return `INV${String(maxNumber + 1).padStart(5, '0')}`;
  }

  async getSetting(userId: string, key: string, storeId?: string): Promise<Settings | undefined> {
    const conditions = [eq(settings.userId, userId), eq(settings.key, key)];
    
    if (storeId) {
      conditions.push(eq(settings.storeId, storeId));
    } else {
      conditions.push(isNull(settings.storeId));
    }
    
    const [setting] = await db
      .select()
      .from(settings)
      .where(and(...conditions));
    return setting || undefined;
  }

  async saveSetting(userId: string, key: string, value: any, storeId?: string): Promise<Settings> {
    const existing = await this.getSetting(userId, key, storeId);
    
    if (existing) {
      const [setting] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      return setting;
    } else {
      const [setting] = await db
        .insert(settings)
        .values({ userId, key, value, storeId: storeId || null })
        .returning();
      return setting;
    }
  }
}

export const storage = new DatabaseStorage();
