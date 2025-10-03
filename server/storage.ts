import { users, stores, products, transactions, settings, feedback, userActivity, notificationLogs, type User, type Store, type Product, type Transaction, type Settings, type Feedback, type InsertUser, type InsertStore, type InsertProduct, type InsertTransaction, type InsertFeedback } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, or, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByRazorpayCustomerId(customerId: string): Promise<User | undefined>;
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
  
  getFeedback(userId?: string, status?: string): Promise<Feedback[]>;
  getFeedbackById(id: string): Promise<Feedback | undefined>;
  createFeedback(userId: string, insertFeedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: string, data: Partial<Feedback>): Promise<Feedback | undefined>;
  
  getAdminStats(): Promise<{
    totalUsers: number;
    totalFeedback: number;
    pendingFeedback: number;
    resolvedFeedback: number;
    feedbackByCategory: { category: string; count: number }[];
    feedbackByRating: { rating: number; count: number }[];
    recentActivity: any[];
  }>;
  
  logUserActivity(userId: string, activityType: string, description?: string, metadata?: any): Promise<void>;
  
  createNotificationLog(title: string, message: string, targetAudience?: string, targetUserIds?: string[], sentBy?: string): Promise<any>;
  updateFCMToken(userId: string, fcmToken: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByRazorpayCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.razorpayCustomerId, customerId));
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
    const now = new Date();
    const [product] = await db
      .insert(products)
      .values({ 
        ...insertProduct, 
        userId, 
        storeId: insertProduct.storeId || null,
        createdAt: now,
        updatedAt: now,
      })
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

  async getFeedback(userId?: string, status?: string): Promise<Feedback[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(feedback.userId, userId));
    }
    if (status) {
      conditions.push(eq(feedback.status, status));
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(feedback)
        .where(and(...conditions))
        .orderBy(desc(feedback.createdAt));
    } else {
      return await db
        .select()
        .from(feedback)
        .orderBy(desc(feedback.createdAt));
    }
  }

  async getFeedbackById(id: string): Promise<Feedback | undefined> {
    const [feedbackItem] = await db.select().from(feedback).where(eq(feedback.id, id));
    return feedbackItem || undefined;
  }

  async createFeedback(userId: string, insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedbackItem] = await db
      .insert(feedback)
      .values({ ...insertFeedback, userId })
      .returning();
    return feedbackItem;
  }

  async updateFeedback(id: string, data: Partial<Feedback>): Promise<Feedback | undefined> {
    const [feedbackItem] = await db
      .update(feedback)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    return feedbackItem || undefined;
  }

  async getAdminStats() {
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult?.count || 0;

    const [totalFeedbackResult] = await db.select({ count: count() }).from(feedback);
    const totalFeedback = totalFeedbackResult?.count || 0;

    const [pendingFeedbackResult] = await db
      .select({ count: count() })
      .from(feedback)
      .where(eq(feedback.status, 'pending'));
    const pendingFeedback = pendingFeedbackResult?.count || 0;

    const [resolvedFeedbackResult] = await db
      .select({ count: count() })
      .from(feedback)
      .where(eq(feedback.status, 'resolved'));
    const resolvedFeedback = resolvedFeedbackResult?.count || 0;

    const feedbackByCategoryRaw = await db
      .select({
        category: feedback.category,
        count: count(),
      })
      .from(feedback)
      .groupBy(feedback.category);
    
    const feedbackByCategory = feedbackByCategoryRaw.map(item => ({
      category: item.category,
      count: Number(item.count),
    }));

    const feedbackByRatingRaw = await db
      .select({
        rating: feedback.rating,
        count: count(),
      })
      .from(feedback)
      .groupBy(feedback.rating);
    
    const feedbackByRating = feedbackByRatingRaw.map(item => ({
      rating: item.rating,
      count: Number(item.count),
    }));

    const recentActivity = await db
      .select()
      .from(userActivity)
      .orderBy(desc(userActivity.createdAt))
      .limit(10);

    return {
      totalUsers,
      totalFeedback,
      pendingFeedback,
      resolvedFeedback,
      feedbackByCategory,
      feedbackByRating,
      recentActivity,
    };
  }

  async logUserActivity(userId: string, activityType: string, description?: string, metadata?: any): Promise<void> {
    await db.insert(userActivity).values({
      userId,
      activityType,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  }

  async createNotificationLog(title: string, message: string, targetAudience?: string, targetUserIds?: string[], sentBy?: string) {
    const [notification] = await db
      .insert(notificationLogs)
      .values({
        title,
        message,
        targetAudience: targetAudience || 'all',
        targetUserIds: targetUserIds ? JSON.stringify(targetUserIds) : null,
        sentBy: sentBy || null,
        sentAt: new Date(),
      })
      .returning();
    return notification;
  }

  async updateFCMToken(userId: string, fcmToken: string): Promise<void> {
    await db
      .update(users)
      .set({ fcmToken })
      .where(eq(users.id, userId));
  }
}


export const storage = new DatabaseStorage();
