import { useEffect, useState, useCallback, Component, ErrorInfo, ReactNode } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/auth-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useTransactionStore } from "@/store/transaction-store";
import { db } from "@/lib/db";
import { PWAUtils } from "@/lib/pwa-utils";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import POS from "@/pages/pos";
import Reports from "@/pages/reports";
import Returns from "@/pages/returns";
import Alerts from "@/pages/alerts";
import Operators from "@/pages/operators";
import Subscription from "@/pages/subscription";
import Settings from "@/pages/settings";
import Feedback from "@/pages/feedback";
import AdminFeedbackManagement from "@/pages/admin/feedback-management";
import AdminDashboard from "@/pages/admin/dashboard";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import FeedbackModal from "@/components/modals/feedback-modal";

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-destructive text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Router component now handles loading state explicitly
function Router({ isAppInitialized }: { isAppInitialized: boolean }) {
  const { isAuthenticated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  console.log('[Router] Render - isAppInitialized:', isAppInitialized, 'isAuthenticated:', isAuthenticated);

  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const handleOpenSidebar = useCallback(() => setIsSidebarOpen(true), []);

  // Show a loading screen while the app state (DB/Auth) is being initialized
  if (!isAppInitialized) {
    console.log('[Router] Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-lg font-medium">Loading store data...</p>
        </div>
      </div>
    );
  }

  // Auth guard — show AuthPage only when user not logged in
  if (!isAuthenticated) {
    console.log('[Router] User not authenticated, showing AuthPage');
    return <AuthPage />;
  }

  console.log('[Router] User authenticated, showing main layout');

  // Main authenticated layout
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar is hidden on small screens by default */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <div className="flex-1 overflow-hidden">
        <Header onMenuClick={handleOpenSidebar} />
        {/* Main content area takes up the remaining height */}
        <main className="overflow-y-auto h-[calc(100vh-4rem)]">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/pos" component={POS} />
            <Route path="/reports" component={Reports} />
            <Route path="/returns" component={Returns} />
            <Route path="/alerts" component={Alerts} />
            <Route path="/operators" component={Operators} />
            <Route path="/subscription" component={Subscription} />
            <Route path="/settings" component={Settings} />
            <Route path="/feedback" component={Feedback} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/feedback" component={AdminFeedbackManagement} />
            {/* Fallback route */}
            <Route component={Dashboard} /> 
          </Switch>

          {/* Footer */}
          <footer className="bg-card border-t border-border mt-12 py-6">
            <div className="px-4 md:px-8 text-center">
              <p className="text-muted-foreground text-sm">
                Presented by{" "}
                <span className="font-semibold text-foreground">n-dizi.in</span> |
                <button
                  onClick={() => PWAUtils.shareApp()}
                  className="text-primary hover:underline mx-2"
                >
                  Share App
                </button>
                |
                <span className="mx-2">Version 1.0.0</span>
              </p>
            </div>
          </footer>
        </main>
      </div>
      <FeedbackModal />
    </div>
  );
}

function App() {
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const loadProducts = useInventoryStore((s) => s.loadProducts);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[App] Starting initialization...');
        
        // 1. Initialize the local database (crucial step)
        console.log('[App] Initializing database...');
        await db.init();
        console.log('[App] Database initialized successfully');
        
        // 2. Wait for the Auth Store to rehydrate from local storage
        // Simple delay to ensure Zustand persist middleware has loaded
        console.log('[App] Waiting for auth store hydration...');
        await new Promise(resolve => setTimeout(resolve, 100));

        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        console.log('[App] Auth status:', isAuthenticated);
        
        // 3. Load other large data only if authenticated
        if (isAuthenticated) {
          console.log('[App] Loading products and transactions...');
          // This will run after persistence is guaranteed to be loaded
          await Promise.all([loadProducts(), loadTransactions()]);
          console.log('[App] Products and transactions loaded');
        }
        
        // 4. Final step: register PWA service worker and mark initialized
        console.log('[App] Registering service worker...');
        await PWAUtils.registerServiceWorker();
        console.log('[App] Service worker registered');
        
        console.log('[App] Initialization complete!');

      } catch (err) {
        console.error("Critical initialization failed (DB or Auth Store):", err);
        // Log full error stack
        if (err instanceof Error) {
          console.error('Error stack:', err.stack);
        }
        // If critical init fails, we still set initialized to show AuthPage/error
      } finally {
        setIsAppInitialized(true);
        console.log('[App] App initialized flag set to true');
      }
    };
    initializeApp();
  }, [loadProducts, loadTransactions]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router isAppInitialized={isAppInitialized} />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
