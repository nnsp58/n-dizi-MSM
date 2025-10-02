import { useState, useMemo } from 'react';
import { useInventoryStore } from '@/store/inventory-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PWAUtils } from '@/lib/pwa-utils';
import { excelExporter } from '@/lib/excel-export';
import AddProductModal from '@/components/modals/add-product-modal';
import ScannerModal from '@/components/modals/scanner-modal';
import { Product } from '@/types';

export default function Inventory() {
  const {
    products,
    loading,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    getFilteredProducts,
    deleteProduct
  } = useInventoryStore();

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'qr' | 'barcode'>('qr');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return ['All Categories', ...uniqueCategories];
  }, [products]);

  const openScanner = (type: 'qr' | 'barcode') => {
    setScannerType(type);
    setShowScanner(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
        PWAUtils.showToast('Product deleted successfully', 'success');
      } catch (error) {
        PWAUtils.showToast('Failed to delete product', 'error');
      }
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    } else if (product.quantity <= (product.lowStockThreshold || 0)) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  const handleModalClose = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => excelExporter.exportInventory(products)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <i className="fas fa-file-excel"></i>
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                onClick={() => openScanner('qr')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <i className="fas fa-qrcode"></i>
                Scan QR
              </Button>
              <Button
                onClick={() => openScanner('barcode')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <i className="fas fa-barcode"></i>
                Scan Barcode
              </Button>
              <Button
                onClick={() => setShowAddProduct(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add Manual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  placeholder="Search products by name, code, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory || ''} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : currentProducts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              {product.category && (
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {product.code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={stockStatus.variant}>
                                {product.quantity}
                              </Badge>
                              {product.quantity <= (product.lowStockThreshold || 0) && (
                                <i className="fas fa-exclamation-triangle text-amber-500 text-sm"></i>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              {PWAUtils.formatCurrency(product.price)}
                            </span>
                          </TableCell>
                          <TableCell>{product.gst}%</TableCell>
                          <TableCell>
                            {product.expiry ? (
                              <span className="text-sm">
                                {PWAUtils.formatDate(product.expiry)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleEdit(product)}
                                variant="ghost"
                                size="sm"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                onClick={() => handleDelete(product)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + Math.max(1, currentPage - 2);
                      if (pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-boxes text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'All Categories'
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first product to the inventory'}
              </p>
              <Button onClick={() => setShowAddProduct(true)}>
                <i className="fas fa-plus mr-2"></i>
                Add Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddProductModal
        open={showAddProduct}
        onOpenChange={handleModalClose}
        editProduct={editingProduct}
      />

      <ScannerModal
        open={showScanner}
        onOpenChange={setShowScanner}
        scanType={scannerType}
        onScanComplete={(result) => {
          console.log('Scanned:', result);
          setShowScanner(false);
          // Open add product modal with scanned code
          setShowAddProduct(true);
        }}
      />
    </div>
  );
}
