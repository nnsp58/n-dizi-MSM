import { useMemo } from 'react';
import { Link } from 'wouter';
import { useInventoryStore } from '@/store/inventory-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useAuthStore } from '@/store/auth-store';
import { useAlerts } from '@/hooks/use-alerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PWAUtils } from '@/lib/pwa-utils';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { products } = useInventoryStore();
  const { transactions, getRecentTransactions, getTodaysTransactions } = useTransactionStore();
  const { lowStockAlerts } = useAlerts();

  const stats = useMemo(() => {
    const todaysTransactions = getTodaysTransactions();
    const todaySales = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
    
    return {
      totalProducts: products.length,
      todaySales,
      totalInvoices: transactions.length,
      lowStockItems: lowStockAlerts.length,
      todaysInvoices: todaysTransactions.length
    };
  }, [products, transactions, getTodaysTransactions, lowStockAlerts]);

  const recentTransactions = getRecentTransactions(5);

  const quickActions = [
    {
      name: 'Point of Sale',
      description: 'Start billing & create invoice',
      icon: 'fas fa-cash-register',
      href: '/pos',
      color: 'bg-primary',
      testId: 'quick-pos'
    },
    {
      name: 'Inventory',
      description: 'Manage products & stock',
      icon: 'fas fa-boxes',
      href: '/inventory',
      color: 'bg-blue-500',
      testId: 'quick-inventory'
    },
    {
      name: 'Reports',
      description: 'Sales & transaction history',
      icon: 'fas fa-chart-line',
      href: '/reports',
      color: 'bg-green-500',
      testId: 'quick-reports'
    },
    {
      name: 'Returns & Refunds',
      description: 'Process product returns',
      icon: 'fas fa-undo',
      href: '/returns',
      color: 'bg-pink-500',
      testId: 'quick-returns'
    },
    {
      name: 'Alerts',
      description: 'Low stock & notifications',
      icon: 'fas fa-bell',
      href: '/alerts',
      color: 'bg-amber-500',
      badge: stats.lowStockItems > 0 ? stats.lowStockItems : undefined,
      testId: 'quick-alerts'
    },
    {
      name: 'Operators',
      description: 'Manage store staff',
      icon: 'fas fa-users',
      href: '/operators',
      color: 'bg-cyan-500',
      testId: 'quick-operators'
    },
    {
      name: 'Settings',
      description: 'Store profile & preferences',
      icon: 'fas fa-cog',
      href: '/settings',
      color: 'bg-gray-500',
      testId: 'quick-settings'
    },
    {
      name: 'Subscription',
      description: 'Upgrade to Premium',
      icon: 'fas fa-crown',
      href: '/subscription',
      color: 'bg-purple-500',
      testId: 'quick-subscription'
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome, {user?.ownerName || 'User'}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {user?.storeName || 'Store'} Management Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => PWAUtils.shareApp()}
            variant="outline"
            size="sm"
            data-testid="button-share"
            className="flex items-center gap-2"
          >
            <i className="fas fa-share-alt"></i>
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-white text-lg md:text-xl"></i>
              </div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Today</span>
            </div>
            <h3 className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Today's Sales</h3>
            <p className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100">
              {PWAUtils.formatCurrency(stats.todaySales)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              {stats.todaysInvoices} invoices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-box text-white text-lg md:text-xl"></i>
              </div>
            </div>
            <h3 className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Products</h3>
            <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.totalProducts}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-receipt text-white text-lg md:text-xl"></i>
              </div>
            </div>
            <h3 className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">All Transactions</h3>
            <p className="text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-100">
              {stats.totalInvoices}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Total invoices</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.lowStockItems > 0 ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800' : 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800'}`}>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${stats.lowStockItems > 0 ? 'bg-red-500' : 'bg-amber-500'} rounded-lg flex items-center justify-center`}>
                <i className="fas fa-exclamation-triangle text-white text-lg md:text-xl"></i>
              </div>
              {stats.lowStockItems > 0 && (
                <span className="text-xs font-bold text-red-700 dark:text-red-400">
                  Alert!
                </span>
              )}
            </div>
            <h3 className={`text-xs ${stats.lowStockItems > 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'} font-medium mb-1`}>
              Low Stock
            </h3>
            <p className={`text-xl md:text-2xl font-bold ${stats.lowStockItems > 0 ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'}`}>
              {stats.lowStockItems}
            </p>
            <p className={`text-xs ${stats.lowStockItems > 0 ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'} mt-1`}>
              Items need restock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Menu */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href} data-testid={`link-${action.testId}`}>
              <Card 
                data-testid={action.testId}
                className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
              >
                <CardContent className="p-4 flex flex-col items-center text-center relative">
                  {action.badge && (
                    <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                      {action.badge}
                    </span>
                  )}
                  <div className={`w-12 h-12 md:w-14 md:h-14 ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                    <i className={`${action.icon} text-white text-xl md:text-2xl`}></i>
                  </div>
                  <h3 className="font-bold text-foreground text-sm md:text-base mb-1">
                    {action.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground">Recent Transactions</CardTitle>
          <Link href="/reports">
            <Button variant="ghost" size="sm" data-testid="button-view-all">
              View All <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  data-testid={`transaction-${transaction.id}`}
                  className="flex items-center gap-3 md:gap-4 p-3 rounded-lg hover:bg-muted transition-colors border"
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-green-600 dark:text-green-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      Invoice #{transaction.invoiceNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.items.length} items • {PWAUtils.formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                  <p className="font-bold text-foreground text-sm md:text-base flex-shrink-0">
                    {PWAUtils.formatCurrency(transaction.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-receipt text-3xl"></i>
              </div>
              <p className="font-medium mb-1">No transactions yet</p>
              <p className="text-sm mb-4">Start selling to see transaction history</p>
              <Link href="/pos">
                <Button data-testid="button-start-selling">
                  <i className="fas fa-shopping-cart mr-2"></i>
                  Start Selling
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
