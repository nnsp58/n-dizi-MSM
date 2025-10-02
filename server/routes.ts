import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, storeName, ownerName, phone, address } = req.body;
      
      const existing = await storage.getUser(email);
      if (existing) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        storeName,
        ownerName,
        phone,
        address,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUser(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sync/pull", async (req, res) => {
    try {
      const { userId, lastSyncAt, storeId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const lastSync = lastSyncAt ? new Date(lastSyncAt) : null;
      
      const products = await storage.getProducts(userId, storeId);
      const transactions = await storage.getTransactions(userId, storeId);
      
      const filteredProducts = lastSync 
        ? products.filter(p => {
            const updated = p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt);
            return updated > lastSync;
          })
        : products;
      
      const filteredTransactions = lastSync
        ? transactions.filter(t => {
            const updated = t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt);
            return updated > lastSync;
          })
        : transactions;

      res.json({
        products: filteredProducts,
        transactions: filteredTransactions,
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sync/push", async (req, res) => {
    try {
      const { userId, products, transactions, storeId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const results = {
        productsCreated: 0,
        productsUpdated: 0,
        transactionsCreated: 0,
      };

      const existingProducts = await storage.getProducts(userId, storeId);
      const productMap = new Map(existingProducts.map(p => [p.id, p]));
      
      const existingTransactions = await storage.getTransactions(userId, storeId);
      const transactionInvoiceSet = new Set(existingTransactions.map(t => t.invoiceNumber));

      for (const product of products || []) {
        const existing = productMap.get(product.id);
        
        if (existing) {
          await storage.updateProduct(existing.id, userId, {
            code: product.code,
            name: product.name,
            category: product.category,
            quantity: product.quantity,
            price: product.price,
            gst: product.gst,
            lowStockThreshold: product.lowStockThreshold,
            expiry: product.expiry,
            description: product.description,
            lastSyncAt: new Date(),
          });
          results.productsUpdated++;
        } else {
          await storage.createProduct(userId, {
            code: product.code,
            name: product.name,
            category: product.category,
            quantity: product.quantity,
            price: product.price,
            gst: product.gst,
            lowStockThreshold: product.lowStockThreshold,
            expiry: product.expiry,
            description: product.description,
            storeId: storeId || null,
          });
          results.productsCreated++;
        }
      }

      for (const transaction of transactions || []) {
        if (!transactionInvoiceSet.has(transaction.invoiceNumber)) {
          await storage.createTransaction(userId, {
            invoiceNumber: transaction.invoiceNumber,
            items: transaction.items,
            subtotal: transaction.subtotal,
            gst: transaction.gst,
            total: transaction.total,
            storeId: storeId || null,
          });
          results.transactionsCreated++;
        }
      }

      const user = await storage.getUserById(userId);
      if (user) {
        await storage.updateUser(user.email, {
          lastSyncAt: new Date(),
        });
      }

      res.json({
        success: true,
        results,
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stores/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stores = await storage.getStores(userId);
      res.json({ stores });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stores", async (req, res) => {
    try {
      const { userId, name, address, phone, gstNumber } = req.body;
      
      if (!userId || !name) {
        return res.status(400).json({ message: "userId and name are required" });
      }

      const store = await storage.createStore(userId, {
        name,
        address,
        phone,
        gstNumber,
      });

      res.json({ store });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
