import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  storeName: text("store_name").notNull(),
  storeType: text("store_type").notNull().default("general"),
  ownerName: text("owner_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  fcmToken: text("fcm_token"),
  plan: text("plan").notNull().default("free"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpayOrderId: text("razorpay_order_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  lastLoginAt: timestamp("last_login_at"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  storeType: text("store_type").notNull().default("general"),
  address: text("address"),
  phone: text("phone"),
  gstNumber: text("gst_number"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").default("pieces"),
  price: real("price").notNull(),
  gst: integer("gst").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(0),
  expiry: text("expiry"),
  description: text("description"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const operators = pgTable("operators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("operator"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  operatorId: varchar("operator_id").references(() => operators.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").notNull(),
  items: jsonb("items").notNull(),
  returnedItems: jsonb("returned_items"),
  subtotal: real("subtotal").notNull(),
  gst: real("gst").notNull(),
  total: real("total").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  returnedItems: jsonb("returned_items").notNull(),
  refundAmount: real("refund_amount").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("completed"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull().default("general"),
  rating: integer("rating").notNull().default(5),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  adminResponse: text("admin_response"),
  adminRespondedAt: timestamp("admin_responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  targetAudience: text("target_audience").notNull().default("all"),
  targetUserIds: jsonb("target_user_ids"),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  status: text("status").notNull().default("sent"),
  sentBy: varchar("sent_by").references(() => users.id, { onDelete: "set null" }),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  storeName: true,
  storeType: true,
  ownerName: true,
  phone: true,
  address: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  code: true,
  name: true,
  category: true,
  quantity: true,
  unit: true,
  price: true,
  gst: true,
  lowStockThreshold: true,
  expiry: true,
  description: true,
});

export const insertStoreSchema = createInsertSchema(stores).pick({
  name: true,
  storeType: true,
  address: true,
  phone: true,
  gstNumber: true,
  isActive: true,
});

export const insertOperatorSchema = createInsertSchema(operators).pick({
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  storeId: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  invoiceNumber: true,
  items: true,
  subtotal: true,
  gst: true,
  total: true,
  storeId: true,
  operatorId: true,
});

export const insertReturnSchema = createInsertSchema(returns).pick({
  transactionId: true,
  returnedItems: true,
  refundAmount: true,
  reason: true,
  status: true,
  storeId: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  category: true,
  rating: true,
  subject: true,
  message: true,
});

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).pick({
  title: true,
  message: true,
  targetAudience: true,
  targetUserIds: true,
  scheduledFor: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).pick({
  activityType: true,
  description: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Operator = typeof operators.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Return = typeof returns.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type UserActivity = typeof userActivity.$inferSelect;

export interface CartItem extends Product {
  cartQuantity: number;
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

// Store Types
export const STORE_TYPES = {
  medical: 'medical',
  provision: 'provision',
  retail: 'retail',
  general: 'general'
} as const;

export type StoreType = typeof STORE_TYPES[keyof typeof STORE_TYPES];

// Unit Catalog based on Store Type
export const UNIT_CATALOG: Record<StoreType, string[]> = {
  medical: ['mg', 'ml', 'tablets', 'capsules', 'strips', 'bottles', 'syrup', 'injection', 'pieces'],
  provision: ['kg', 'gram', 'ltr', 'ml', 'pieces', 'packets', 'dozen', 'boxes'],
  retail: ['pieces', 'sets', 'boxes', 'units', 'pairs', 'packets'],
  general: ['pieces', 'kg', 'gram', 'ltr', 'ml', 'tablets', 'capsules', 'strips', 'bottles', 'packets', 'dozen', 'boxes', 'sets', 'units', 'pairs']
};

export const STORE_TYPE_LABELS: Record<StoreType, string> = {
  medical: 'Medical Store',
  provision: 'Provision Store',
  retail: 'Retail Shop',
  general: 'General Store'
};

// Feedback Categories
export const FEEDBACK_CATEGORIES = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  improvement: 'Improvement',
  general: 'General Feedback',
  other: 'Other'
} as const;

export type FeedbackCategory = keyof typeof FEEDBACK_CATEGORIES;

// Notification Audience Types
export const NOTIFICATION_AUDIENCES = {
  all: 'All Users',
  premium: 'Premium Subscribers',
  free: 'Free Plan Users',
  inactive: 'Inactive Users',
  custom: 'Custom Selection'
} as const;

export type NotificationAudience = keyof typeof NOTIFICATION_AUDIENCES;

// User Activity Types
export const ACTIVITY_TYPES = {
  login: 'login',
  logout: 'logout',
  product_created: 'product_created',
  product_updated: 'product_updated',
  product_deleted: 'product_deleted',
  transaction_created: 'transaction_created',
  return_processed: 'return_processed',
  subscription_purchased: 'subscription_purchased',
  feedback_submitted: 'feedback_submitted'
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

// Admin Dashboard Stats
export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingFeedback: number;
  notificationsSent: number;
  storeTypeDistribution: Record<StoreType, number>;
}
