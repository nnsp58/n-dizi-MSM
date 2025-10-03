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
- Users: Authentication, store profile, storeType, subscription status, and Razorpay payment metadata
- Stores: Multi-store support with user relationships and storeType
- Operators: Store staff/employees (up to 5 per owner) with role assignment and sales attribution
- Products: Inventory items with stock levels, unit (kg/ltr/tablets/etc), pricing, GST, expiry tracking, and store association
- Transactions: Sales records with invoice numbers, itemized purchases, operator tracking, returnedItems tracking, and store association
- Returns: Return records with transactionId reference, returnedItems (jsonb), refundAmount, reason, and status
- Settings: User preferences and app configuration stored as JSON with store-level isolation

### Core Features & Patterns

**Authentication System**
- Session-based authentication using express-session
- Bcrypt password hashing for secure credential storage
- Store type selection during signup (Medical/Provision/Retail/General)
- PostgreSQL-backed user authentication with cloud sync
- Local-first authentication using IndexedDB for offline access

**Inventory Management**
- CRUD operations for products with code/barcode associations
- Store type-based unit management (Medical: mg/ml/tablets, Provision: kg/ltr, Retail: pieces/sets, General: all units)
- Dynamic unit selector in product form based on store type
- Category-based filtering and search functionality
- Low stock threshold alerts and expiry date tracking
- Excel export functionality using XLSX library

**Point of Sale (POS)**
- Shopping cart management with real-time total calculations
- GST computation at item level
- QR/Barcode scanning integration using jsQR and device camera
- Invoice generation with PDF export using jsPDF
- Optional operator selection for sales attribution
- Mobile-responsive design with bottom drawer cart (Sheet component)

**Multi-Operator Management**
- CRUD operations for up to 5 operators per store owner
- Operator profiles with name, email, phone, role, and active/inactive status
- Zustand-based operators store with localStorage persistence
- Sales attribution via operatorId tracking in transactions
- Dashboard quick access tile for operators management

**Reporting & Analytics**
- Tabbed interface: Sales Report and Operator Performance
- Date range filtering for all reports
- Transaction history with pagination and search
- Export capabilities (Excel, CSV) for inventory and sales data
- Dashboard with key metrics (sales, inventory, alerts)
- Operator performance tracking:
  - Ranked by revenue (highest to lowest)
  - Metrics: transactions count, items sold, total revenue
  - Visual indicators: trophy/medal/award icons for top 3
  - "Inactive" badges for former/removed operators
  - Historical data preserved even after operator deletion
  - Fallback "Former Employee" entry for deleted operators

**Returns & Refunds System**
- Complete post-sale return processing workflow
- Invoice lookup by invoice number with validation
- Item-level return selection with quantity control
- Automatic inventory restoration on return approval
- Return tracking in transaction records to prevent over-refunding
- Aggregated return quantities per product across multiple returns
- Smart validation: cannot return more than (purchased - already returned)
- Visual indicators for already-returned quantities with badges
- Optional return reason field for documentation
- Returns history with status tracking (completed/pending)
- Zustand-based returns store with localStorage persistence
- Database schema: `returns` table with transactionId reference
- Transaction.returnedItems field tracks cumulative returns per product
- Input fields automatically disabled when all units returned
- Mobile-responsive design with clear UX feedback
- Integrated into sidebar navigation and dashboard quick access

**Feedback & Admin Control System**
- Complete user feedback submission and admin management system
- User-facing feedback form at /feedback with:
  - Category selection (Bug, Feature Request, Improvement, General, Other)
  - 5-star rating system with interactive UI
  - Subject and message fields with validation
  - Previous feedback history with status tracking
- Admin feedback management at /admin/feedback with:
  - View all user feedback with filtering by status
  - Respond to feedback with admin comments
  - Update feedback status (pending, reviewed, resolved, closed)
  - isAdmin role check for secure access
- Session-based authentication for API security:
  - POST /api/feedback uses req.session.userId (prevents user ID spoofing)
  - GET /api/feedback enforces user isolation (users only see own feedback)
  - Admin role check for cross-user data access
  - Proper 401/403 error handling for unauthorized access
- Database schema:
  - `feedback` table with userId FK, category, rating, subject, message, status, adminResponse
  - `notification_logs` table for push notification tracking (prepared for Firebase integration)
  - `user_activity` table for analytics and usage tracking
- Users table enhanced with:
  - `isAdmin` boolean field for admin role identification
  - `fcmToken` field for Firebase Cloud Messaging (future push notifications)
- Settings page integration with "Give Feedback" button in Help & Resources section
- Mobile-responsive design with proper form validation and toast notifications

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