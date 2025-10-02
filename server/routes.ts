import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { razorpay, verifyWebhookSignature, SUBSCRIPTION_PLANS } from "./razorpay";
import crypto from "crypto";

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

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`User registered and session set: ${user.id}`);
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

      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`User logged in and session set: ${user.id}`);
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

  app.post("/api/subscription/verify", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { paymentId, orderId, signature } = req.body;
      
      if (!paymentId || !orderId || !signature) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      if (user.razorpayPaymentId === paymentId) {
        return res.json({ success: true, message: "Subscription already activated" });
      }

      const order = await razorpay.orders.fetch(orderId);
      const plan = order.notes?.plan;
      const orderUserId = order.notes?.userId;

      if (!plan || orderUserId !== userId) {
        return res.status(400).json({ success: false, message: "Invalid order" });
      }

      const now = new Date();
      const currentEndsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : now;
      const baseDate = currentEndsAt > now ? currentEndsAt : now;

      const endsAt = new Date(baseDate);
      if (plan === 'yearly') {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      } else {
        endsAt.setMonth(endsAt.getMonth() + 1);
      }

      await storage.updateUser(user.email, {
        subscriptionStatus: 'active',
        plan: 'pro',
        subscriptionEndsAt: endsAt,
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
      });

      console.log(`Subscription activated for user ${userId}: ${plan} plan, expires ${endsAt.toISOString()}`);
      res.json({ success: true, message: "Subscription activated" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscription/checkout", async (req, res) => {
    try {
      const userId = req.session.userId;
      console.log(`Checkout request - session userId: ${userId}`);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { plan } = req.body;
      
      if (!plan) {
        return res.status(400).json({ message: "plan is required" });
      }

      const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
      if (!planConfig) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const options = {
        amount: planConfig.amount,
        currency: planConfig.currency,
        receipt: `receipt_${plan}_${userId}_${Date.now()}`,
        notes: {
          userId: userId,
          plan: plan,
          email: user.email,
        },
      };

      const order = await razorpay.orders.create(options);

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/webhooks/razorpay", async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ message: "Missing signature" });
      }

      const isValid = verifyWebhookSignature(req.rawBody as Buffer, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ message: "Invalid signature" });
      }

      const event = req.body;

      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const notes = payment.notes;

        if (notes && notes.userId && notes.plan) {
          const user = await storage.getUserById(notes.userId);
          
          if (user) {
            if (user.razorpayPaymentId === payment.id) {
              console.log(`Webhook: Payment ${payment.id} already processed for user ${notes.userId}`);
              return res.json({ status: 'ok' });
            }

            const now = new Date();
            const currentEndsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : now;
            const baseDate = currentEndsAt > now ? currentEndsAt : now;

            const endsAt = new Date(baseDate);
            if (notes.plan === 'yearly') {
              endsAt.setFullYear(endsAt.getFullYear() + 1);
            } else {
              endsAt.setMonth(endsAt.getMonth() + 1);
            }

            await storage.updateUser(user.email, {
              subscriptionStatus: 'active',
              plan: 'pro',
              subscriptionEndsAt: endsAt,
              razorpayPaymentId: payment.id,
              razorpayOrderId: orderId,
            });

            console.log(`Webhook: Subscription activated for user ${notes.userId}: ${notes.plan} plan, expires ${endsAt.toISOString()}`);
          } else {
            console.error(`Webhook: User ${notes.userId} not found for payment ${payment.id}`);
          }
        } else {
          console.error(`Webhook: Missing userId or plan in payment notes for payment ${payment.id}`);
        }
      } else if (event.event === 'payment.failed') {
        console.error('Webhook: Payment failed:', event.payload.payment.entity.id, event.payload.payment.entity.error_description);
      }

      res.json({ status: 'ok' });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
