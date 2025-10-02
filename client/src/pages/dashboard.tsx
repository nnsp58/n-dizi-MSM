import { useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { useInventoryStore } from '@/store/inventory-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useAuthStore } from '@/store/auth-store';
import { useAlerts } from '@/hooks/use-alerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PWAUtils } from '@/lib/pwa-utils';
import { excelExporter } from '@/lib/excel-export';
import AddProductModal from '@/components/modals/add-product-modal';
import ScannerModal from '@/components/modals/scanner-modal';
import { useState } from 'react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { products } = useInventoryStore();
  const { transactions, getRecentTransactions, getTodaysTransactions } = useTransactionStore();
  const { lowStockAlerts } = useAlerts();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'qr' | 'barcode'>('qr');

  const stats = useMemo(() => {
    const todaysTransactions = getTodaysTransactions();
    const todaySales = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
    
    return {
      totalProducts: products.length,
      todaySales,
      totalInvoices: transactions.length,
      lowStockItems: lowStockAlerts.length
    };
  }, [products, transactions, getTodaysTransactions, lowStockAlerts]);

  const recentTransactions = getRecentTransactions(5);

  const handleRequestStock = () => {
    const lowStockItems = lowStockAlerts.map(alert => 
      `- ${alert.product.name} (Current: ${alert.product.quantity}, Threshold: ${alert.product.lowStockThreshold})`
    ).join('\n');
    
    const subject = 'Stock Request - ' + (user?.storeName || 'Store');
    const body = `Dear Supplier,\n\nWe need to restock the following items:\n\n${lowStockItems}\n\nThank you,\n${user?.storeName || 'Store'}`;
    
    PWAUtils.openMailto('supplier@example.com', subject, body);
  };

  const openScanner = (type: 'qr' | 'barcode') => {
    setScannerType(type);
    setShowScanner(true);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.ownerName || 'User'}!
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => openScanner('qr')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <i className="fas fa-qrcode"></i>
            <span className="hidden sm:inline">Scan Product</span>
          </Button>
          <Link href="/pos">
            <Button className="flex items-center gap-2">
              <i className="fas fa-shopping-cart"></i>
              <span className="hidden sm:inline">New Sale</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-primary text-xl"></i>
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                <i className="fas fa-arrow-up text-xs"></i>
                Today
              </span>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Today's Sales</h3>
            <p className="text-2xl font-bold text-foreground">
              {PWAUtils.formatCurrency(stats.todaySales)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-receipt text-secondary text-xl"></i>
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Transactions</h3>
            <p className="text-2xl font-bold text-foreground">{stats.totalInvoices}</p>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-boxes text-amber-600 text-xl"></i>
              </div>
              {stats.lowStockItems > 0 && (
                <span className="text-sm font-medium text-destructive flex items-center gap-1">
                  <i className="fas fa-exclamation-triangle text-xs"></i>
                  {stats.lowStockItems}
                </span>
              )}
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Low Stock Items</h3>
            <p className="text-2xl font-bold text-foreground">{stats.lowStockItems}</p>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-box text-green-600 text-xl"></i>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total</span>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Products</h3>
            <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setShowAddProduct(true)}
              variant="outline"
              className="w-full flex items-center gap-3 p-3 justify-start h-auto"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-plus text-primary"></i>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Add Product</p>
                <p className="text-xs text-muted-foreground">Manual or scan</p>
              </div>
            </Button>

            <Button
              onClick={() => excelExporter.exportInventory(products)}
              variant="outline"
              className="w-full flex items-center gap-3 p-3 justify-start h-auto"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-excel text-green-600"></i>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Export Inventory</p>
                <p className="text-xs text-muted-foreground">Download Excel</p>
              </div>
            </Button>

            <Button
              onClick={handleRequestStock}
              variant="outline"
              className="w-full flex items-center gap-3 p-3 justify-start h-auto"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-envelope text-amber-600"></i>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Request Stock</p>
                <p className="text-xs text-muted-foreground">Email supplier</p>
              </div>
            </Button>

            <Button
              onClick={() => PWAUtils.shareApp()}
              variant="outline"
              className="w-full flex items-center gap-3 p-3 justify-start h-auto"
            >
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-share-alt text-secondary"></i>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Share App</p>
                <p className="text-xs text-muted-foreground">Invite others</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground">Recent Transactions</CardTitle>
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-check text-green-600"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        Invoice #{transaction.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.items.length} items • {PWAUtils.formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                    <p className="font-bold text-foreground">
                      {PWAUtils.formatCurrency(transaction.total)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-receipt text-4xl mb-4"></i>
                <p>No transactions yet</p>
                <p className="text-sm">Start selling to see transaction history</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddProductModal 
        open={showAddProduct} 
        onOpenChange={setShowAddProduct}
      />
      
      <ScannerModal
        open={showScanner}
        onOpenChange={setShowScanner}
        scanType={scannerType}
        onScanComplete={(result) => {
          console.log('Scanned:', result);
          setShowScanner(false);
          // Handle scan result - could open add product modal with pre-filled code
        }}
      />
    </div>
  );
}
