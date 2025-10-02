import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  storeName: text("store_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  price: real("price").notNull(),
  gst: integer("gst").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(0),
  expiry: text("expiry"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  items: jsonb("items").notNull(),
  subtotal: real("subtotal").notNull(),
  gst: real("gst").notNull(),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  storeName: true,
  ownerName: true,
  phone: true,
  address: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  code: true,
  name: true,
  category: true,
  quantity: true,
  price: true,
  gst: true,
  lowStockThreshold: true,
  expiry: true,
  description: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  invoiceNumber: true,
  items: true,
  subtotal: true,
  gst: true,
  total: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Settings = typeof settings.$inferSelect;

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
