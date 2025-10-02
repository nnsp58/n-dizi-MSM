import { useState } from 'react';
import { useAlerts } from '@/hooks/use-alerts';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PWAUtils } from '@/lib/pwa-utils';
import { excelExporter } from '@/lib/excel-export';
import AddProductModal from '@/components/modals/add-product-modal';

export default function Alerts() {
  const { user } = useAuthStore();
  const { alerts, lowStockAlerts, expiryAlerts } = useAlerts();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleRequestStock = () => {
    const lowStockItems = lowStockAlerts.map(alert => 
      `- ${alert.product.name} (Current: ${alert.product.quantity}, Threshold: ${alert.product.lowStockThreshold})`
    ).join('\n');
    
    const subject = `Stock Request - ${user?.storeName || 'Store'}`;
    const body = `Dear Supplier,

We need to restock the following items:

${lowStockItems}

Please provide availability and pricing for these items.

Thank you,
${user?.storeName || 'Store'}
${user?.ownerName || ''}
${user?.phone || ''}`;
    
    PWAUtils.openMailto('supplier@example.com', subject, body);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const exportLowStockReport = () => {
    const products = lowStockAlerts.map(alert => alert.product);
    excelExporter.exportLowStockReport(products);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'fas fa-exclamation-circle';
      case 'medium':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-info-circle';
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Manage low stock and expiry alerts</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportLowStockReport}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <i className="fas fa-file-excel"></i>
            <span className="hidden sm:inline">Export Report</span>
          </Button>
          <Button
            onClick={handleRequestStock}
            className="flex items-center gap-2"
            disabled={lowStockAlerts.length === 0}
          >
            <i className="fas fa-envelope"></i>
            <span>Request Stock</span>
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-bell text-amber-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{lowStockAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-destructive text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{expiryAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-orange-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="low-stock" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="low-stock" className="flex items-center gap-2">
                Low Stock
                {lowStockAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {lowStockAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="expiring" className="flex items-center gap-2">
                Expiring Soon
                {expiryAlerts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {expiryAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">All Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="low-stock" className="space-y-4 mt-6">
              {lowStockAlerts.length > 0 ? (
                lowStockAlerts.map((alert) => (
                  <div key={alert.id} className="border border-destructive/30 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className={`${getPriorityIcon(alert.priority)} text-destructive text-xl`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-foreground text-lg">{alert.product.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                Code: <code className="bg-muted px-1 rounded">{alert.product.code}</code>
                              </p>
                            </div>
                            <Badge variant={getPriorityColor(alert.priority)} className="ml-2">
                              {alert.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                              <p className="font-bold text-destructive">{alert.product.quantity} units</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Threshold</p>
                              <p className="font-semibold">{alert.product.lowStockThreshold || 0} units</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                              <p className="font-semibold">{PWAUtils.formatDate(alert.product.updatedAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Price</p>
                              <p className="font-semibold">{PWAUtils.formatCurrency(alert.product.price)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditProduct(alert.product)}
                              size="sm"
                            >
                              Update Stock
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
                  <h3 className="text-lg font-semibold text-foreground mb-2">All products are well stocked!</h3>
                  <p className="text-muted-foreground">No low stock alerts at the moment.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="expiring" className="space-y-4 mt-6">
              {expiryAlerts.length > 0 ? (
                expiryAlerts.map((alert) => (
                  <div key={alert.id} className="border border-amber-300 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-clock text-amber-600 text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{alert.product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Code: <code className="bg-muted px-1 rounded">{alert.product.code}</code>
                            </p>
                          </div>
                          <Badge variant={getPriorityColor(alert.priority)} className="ml-2">
                            {alert.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                            <p className="font-bold text-amber-600">
                              {PWAUtils.formatDate(alert.product.expiry!)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Days Left</p>
                            <p className="font-semibold">
                              {Math.floor((new Date(alert.product.expiry!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Stock Qty</p>
                            <p className="font-semibold">{alert.product.quantity} units</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Price</p>
                            <p className="font-semibold">{PWAUtils.formatCurrency(alert.product.price)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditProduct(alert.product)}
                            size="sm"
                          >
                            Update Product
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No products expiring soon!</h3>
                  <p className="text-muted-foreground">All products have sufficient time before expiry.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4 mt-6">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className={`${getPriorityIcon(alert.priority)} text-muted-foreground text-xl`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-foreground text-lg">{alert.product.name}</h3>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getPriorityColor(alert.priority)}>
                              {alert.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {alert.type === 'low-stock' ? 'Low Stock' : 'Expiring'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleEditProduct(alert.product)}
                            size="sm"
                          >
                            {alert.type === 'low-stock' ? 'Update Stock' : 'Update Product'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No alerts!</h3>
                  <p className="text-muted-foreground">Everything looks good. No action required.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddProductModal
        open={showAddProduct}
        onOpenChange={(open) => {
          setShowAddProduct(open);
          if (!open) setEditingProduct(null);
        }}
        editProduct={editingProduct}
      />
    </div>
  );
}
