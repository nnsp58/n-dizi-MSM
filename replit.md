# n-dizi Store Manager

## Overview

n-dizi Store Manager is an offline-first Progressive Web Application (PWA) designed for shop inventory management. The application provides comprehensive point-of-sale functionality, inventory tracking, sales reporting, and invoice generation with QR/barcode scanning capabilities. Built as a full-stack application with React frontend and Express backend, it emphasizes offline functionality using IndexedDB for local data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing instead of React Router

**State Management**
- Zustand with persistence middleware for global state management
- Separate stores for authentication, inventory, POS cart, and transactions
- Local-first approach with IndexedDB as primary data storage

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming (light/dark mode support)
- Inter font family for consistent typography

**Offline-First Strategy**
- Service Worker for caching static assets and API responses
- IndexedDB for persistent local data storage
- Progressive enhancement with online/offline state detection
- PWA manifest for installable app experience

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API endpoints
- ESM module system (type: "module")
- Development mode uses tsx for hot reloading
- Production builds with esbuild for optimized bundling

**Data Layer Design**
- Dual storage implementation: MemStorage (in-memory) and planned Drizzle ORM integration
- Storage interface pattern (IStorage) for abstraction between implementations
- PostgreSQL database schema defined with Drizzle ORM
- Neon serverless PostgreSQL for cloud database

**Database Schema**
- Users: Authentication, store profile, subscription status, and Razorpay payment metadata
- Stores: Multi-store support with user relationships
- Operators: Store staff/employees (up to 5 per owner) with role assignment and sales attribution
- Products: Inventory items with stock levels, pricing, GST, expiry tracking, and store association
- Transactions: Sales records with invoice numbers, itemized purchases, operator tracking, and store association
- Settings: User preferences and app configuration stored as JSON with store-level isolation

### Core Features & Patterns

**Authentication System**
- Session-based authentication using express-session
- Bcrypt password hashing for secure credential storage
- PostgreSQL-backed user authentication with cloud sync
- Local-first authentication using IndexedDB for offline access

**Inventory Management**
- CRUD operations for products with code/barcode associations
- Category-based filtering and search functionality
- Low stock threshold alerts and expiry date tracking
- Excel export functionality using XLSX library

**Point of Sale (POS)**
- Shopping cart management with real-time total calculations
- GST computation at item level
- QR/Barcode scanning integration using jsQR and device camera
- Invoice generation with PDF export using jsPDF

**Reporting & Analytics**
- Date range filtering for sales reports
- Transaction history with pagination
- Export capabilities for inventory and sales data
- Dashboard with key metrics (sales, inventory, alerts)

**Scanner Integration**
- Camera-based QR/barcode scanning using jsQR
- Manual code entry fallback
- Support for multiple barcode formats
- Product lookup by scanned codes

**Document Generation**
- PDF invoice generation with store branding
- Watermark for free plan users
- Excel exports for inventory and transaction reports
- Print-friendly invoice previews

**Payment Integration (Razorpay) - BETA**
- Secure payment processing for premium subscriptions
- Session-authenticated checkout endpoints
- Server-side payment verification with signature validation
- Webhook support for automated subscription activation
- Idempotent payment processing to prevent duplicate charges
- Subscription renewal logic that extends from current expiry date
- Two subscription tiers: Monthly (₹299/month) and Yearly (₹2,999/year)
- Order metadata tracking (userId, plan, email) for audit trail
- Payment.captured webhook events for backup activation flow
- Hybrid authentication: backend session established during signup/login
- Graceful offline degradation with console warnings

**Known Limitations:**
- Session expiry handling: Users may encounter 401 errors if backend session expires without re-login
- Logout incomplete: Local logout doesn't invalidate server session
- No UI feedback when backend sync fails during offline signup/login
- Session refresh flow not implemented - requires re-login for subscription after session expiry

**Recommended Next Steps for Production:**
1. Implement automatic session refresh or re-authentication flow before checkout
2. Add clear UI messaging when backend authentication fails
3. Implement `/api/auth/logout` endpoint and call during logout
4. Add session status check on subscription page with user-friendly error handling

## External Dependencies

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form + zod**: Form validation and type-safe schemas
- **date-fns**: Date manipulation and formatting
- **jsQR**: QR code scanning functionality
- **jsPDF**: PDF document generation
- **xlsx**: Excel file generation and export

### Backend & Database
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **drizzle-zod**: Zod schema generation from Drizzle schemas
- **express-session**: Session management for authentication
- **razorpay**: Payment gateway SDK for subscription processing
- **bcryptjs**: Password hashing for secure authentication

### UI & Styling
- **Radix UI**: Headless component primitives (17+ components)
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant styling
- **lucide-react**: Icon library

### Development Tools
- **Vite plugins**: Replit-specific tooling (cartographer, dev banner, runtime error overlay)
- **TypeScript**: Static type checking
- **ESBuild**: Production bundling

### PWA & Device APIs
- **Service Worker**: Custom implementation for offline caching
- **IndexedDB**: Browser database for local persistence
- **Web Share API**: Native sharing functionality
- **MediaDevices API**: Camera access for scanning
- **Notifications API**: Alert system (planned)

### Data Flow Pattern
The application follows a local-first architecture where all data operations occur in IndexedDB first, with planned server synchronization. The storage interface allows switching between in-memory (development/testing) and PostgreSQL (production) backends without changing application code.