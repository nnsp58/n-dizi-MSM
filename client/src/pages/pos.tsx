import { useState, useMemo } from 'react';
import { useInventoryStore } from '@/store/inventory-store';
import { usePOSStore } from '@/store/pos-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PWAUtils } from '@/lib/pwa-utils';
import { pdfGenerator } from '@/lib/pdf-generator';
import ScannerModal from '@/components/modals/scanner-modal';
import InvoicePreviewModal from '@/components/modals/invoice-preview-modal';
import { Product, InvoiceData } from '@/types';

export default function POS() {
  const { user } = useAuthStore();
  const { products, getProductByCode, updateProduct } = useInventoryStore();
  const { 
    cart, 
    searchQuery, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal,
    setSearchQuery 
  } = usePOSStore();
  const { addTransaction } = useTransactionStore();

  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'qr' | 'barcode'>('qr');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);

  const cartTotals = getCartTotal();

  const quickProducts = products.slice(0, 6);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return products
      .filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [searchQuery, products]);

  const openScanner = (type: 'qr' | 'barcode') => {
    setScannerType(type);
    setShowScanner(true);
  };

  const handleScanComplete = (result: { code: string }) => {
    const product = getProductByCode(result.code);
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
        PWAUtils.showToast(`Added ${product.name} to cart`, 'success');
      } else {
        PWAUtils.showToast('Product is out of stock', 'error');
      }
    } else {
      PWAUtils.showToast('Product not found', 'error');
    }
    setShowScanner(false);
    setSearchQuery('');
  };

  const handleAddProduct = () => {
    const product = getProductByCode(searchQuery) || 
                    products.find(p => p.name.toLowerCase() === searchQuery.toLowerCase());
    
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
        PWAUtils.showToast(`Added ${product.name} to cart`, 'success');
      } else {
        PWAUtils.showToast('Product is out of stock', 'error');
      }
    } else {
      PWAUtils.showToast('Product not found', 'error');
    }
    setSearchQuery('');
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (product && newQuantity > product.quantity) {
      PWAUtils.showToast(`Only ${product.quantity} units available`, 'error');
      return;
    }
    
    updateQuantity(productId, newQuantity);
  };

  const generateInvoice = async () => {
    if (cart.length === 0) {
      PWAUtils.showToast('Cart is empty', 'error');
      return;
    }

    try {
      const invoiceNumber = await addTransaction(cart, cartTotals);
      
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await updateProduct(product.id, {
            quantity: product.quantity - item.cartQuantity
          });
        }
      }

      const invoiceData: InvoiceData = {
        invoiceNumber,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        storeName: user?.storeName || 'Store',
        storeAddress: user?.address,
        storeContact: user?.phone,
        items: cart,
        subtotal: cartTotals.subtotal,
        gst: cartTotals.gst,
        total: cartTotals.total
      };

      setCurrentInvoice(invoiceData);
      setShowInvoicePreview(true);
      setShowMobileCart(false);
      
      clearCart();
      PWAUtils.showToast('Invoice generated successfully!', 'success');
    } catch (error) {
      PWAUtils.showToast('Failed to generate invoice', 'error');
    }
  };

  const CartContent = () => (
    <>
      {cart.length > 0 ? (
        <>
          <div className="space-y-3 mb-6 max-h-[50vh] lg:max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} data-testid={`cart-item-${item.id}`} className="p-3 bg-muted rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-foreground text-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.code}
                    </p>
                  </div>
                  <Button
                    onClick={() => removeFromCart(item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive p-1"
                    data-testid={`button-remove-${item.id}`}
                  >
                    <i className="fas fa-times text-sm"></i>
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleQuantityChange(item.id, item.cartQuantity - 1)}
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <i className="fas fa-minus text-xs"></i>
                    </Button>
                    <span className="w-12 text-center font-medium" data-testid={`quantity-${item.id}`}>
                      {item.cartQuantity}
                    </span>
                    <Button
                      onClick={() => handleQuantityChange(item.id, item.cartQuantity + 1)}
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      data-testid={`button-increase-${item.id}`}
                    >
                      <i className="fas fa-plus text-xs"></i>
                    </Button>
                  </div>
                  <p className="font-bold text-foreground">
                    {PWAUtils.formatCurrency(item.price * item.cartQuantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium" data-testid="text-subtotal">
                {PWAUtils.formatCurrency(cartTotals.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <span className="font-medium" data-testid="text-gst">
                {PWAUtils.formatCurrency(cartTotals.gst)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span data-testid="text-total">{PWAUtils.formatCurrency(cartTotals.total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={generateInvoice}
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-generate-invoice"
            >
              <i className="fas fa-receipt"></i>
              Generate Invoice
            </Button>
            <Button
              onClick={() => {
                clearCart();
                setShowMobileCart(false);
              }}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-clear-cart"
            >
              <i className="fas fa-trash"></i>
              Clear Cart
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <i className="fas fa-shopping-cart text-4xl text-muted-foreground mb-3"></i>
          <p className="text-muted-foreground">Cart is empty</p>
          <p className="text-sm text-muted-foreground">Add products to start selling</p>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="p-4 md:p-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">Point of Sale</h1>
              <p className="text-sm md:text-base text-muted-foreground">Scan or select products to create an invoice</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Add Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => openScanner('qr')}
                    className="flex items-center justify-center gap-2 h-12 md:h-10"
                    data-testid="button-scan-qr"
                  >
                    <i className="fas fa-qrcode"></i>
                    <span className="text-sm md:text-base">Scan QR Code</span>
                  </Button>
                  <Button
                    onClick={() => openScanner('barcode')}
                    variant="secondary"
                    className="flex items-center justify-center gap-2 h-12 md:h-10"
                    data-testid="button-scan-barcode"
                  >
                    <i className="fas fa-barcode"></i>
                    <span className="text-sm md:text-base">Scan Barcode</span>
                  </Button>
                </div>
                
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                  <Input
                    placeholder="Search product by name, code, or scan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                    className="pl-10"
                    data-testid="input-search-product"
                  />
                  {searchQuery && (
                    <Button
                      onClick={handleAddProduct}
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      data-testid="button-add-search"
                    >
                      Add
                    </Button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="border rounded-lg p-2 space-y-1">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          addToCart(product);
                          setSearchQuery('');
                        }}
                        className="w-full p-2 text-left hover:bg-muted rounded flex items-center justify-between"
                        data-testid={`search-result-${product.id}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{PWAUtils.formatCurrency(product.price)}</p>
                          <p className="text-xs text-muted-foreground">Stock: {product.quantity}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Select</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickProducts.map((product) => (
                    <Button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      variant="outline"
                      className="p-3 md:p-4 h-auto flex flex-col items-start text-left hover:border-primary"
                      disabled={product.quantity === 0}
                      data-testid={`quick-product-${product.id}`}
                    >
                      <p className="font-medium text-foreground text-sm mb-1 truncate w-full">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2 truncate w-full">
                        {product.code}
                      </p>
                      <div className="flex items-center justify-between w-full">
                        <p className="font-bold text-primary text-sm">
                          {PWAUtils.formatCurrency(product.price)}
                        </p>
                        <Badge variant={product.quantity > 0 ? 'default' : 'destructive'} className="text-xs">
                          {product.quantity}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden lg:block space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Cart ({cart.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CartContent />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Cart Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-lg">
        <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
          <SheetTrigger asChild>
            <button 
              className="w-full p-4 flex items-center justify-between"
              data-testid="button-mobile-cart"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-white"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cart.length > 0 ? 'Tap to view' : 'Empty cart'}
                  </p>
                </div>
              </div>
              {cart.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">
                    {PWAUtils.formatCurrency(cartTotals.total)}
                  </p>
                  <i className="fas fa-chevron-up"></i>
                </div>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Cart ({cart.length})</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <CartContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <ScannerModal
        open={showScanner}
        onOpenChange={setShowScanner}
        scanType={scannerType}
        onScanComplete={handleScanComplete}
      />

      <InvoicePreviewModal
        open={showInvoicePreview}
        onOpenChange={setShowInvoicePreview}
        invoiceData={currentInvoice}
      />
    </>
  );
}
