import { useEffect, useState, useCallback } from "react";
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

function Router() {
  const { isAuthenticated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const handleOpenSidebar = useCallback(() => setIsSidebarOpen(true), []);

  // ✅ Auth guard — show AuthPage only when user not logged in
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <div className="flex-1 overflow-hidden">
        <Header onMenuClick={handleOpenSidebar} />
        <main className="overflow-auto h-[calc(100vh-4rem)]">
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
  const loadProducts = useInventoryStore((s) => s.loadProducts);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await db.init();
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (isAuthenticated) {
          await Promise.all([loadProducts(), loadTransactions()]);
        }
        await PWAUtils.registerServiceWorker();
      } catch (err) {
        console.error("Init failed:", err);
      }
    };
    initializeApp();
  }, [loadProducts, loadTransactions]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
