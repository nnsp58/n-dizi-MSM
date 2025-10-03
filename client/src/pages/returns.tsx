import { useState, useMemo } from 'react';
import { useTransactionStore } from '@/store/transaction-store';
import { useReturnsStore, ReturnItem } from '@/store/returns-store';
import { useInventoryStore } from '@/store/inventory-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PWAUtils } from '@/lib/pwa-utils';
import { CartItem } from '@/types';

export default function Returns() {
  const { transactions, getTransactionByInvoice } = useTransactionStore();
  const { addReturn, getAllReturns } = useReturnsStore();
  const { products, updateProduct } = useInventoryStore();
  
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [showReturnsList, setShowReturnsList] = useState(false);

  const allReturns = getAllReturns();

  const handleSearchInvoice = () => {
    if (!invoiceSearch.trim()) {
      PWAUtils.showToast('Please enter invoice number', 'error');
      return;
    }

    const transaction = getTransactionByInvoice(invoiceSearch.trim());
    if (transaction) {
      setSelectedTransaction(transaction);
      setReturnQuantities({});
      setReturnReason('');
    } else {
      PWAUtils.showToast('Invoice not found', 'error');
      setSelectedTransaction(null);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setReturnQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity)
    }));
  };

  const selectedItemsForReturn = useMemo(() => {
    if (!selectedTransaction) return [];
    
    return selectedTransaction.items
      .filter((item: CartItem) => (returnQuantities[item.id] || 0) > 0)
      .map((item: CartItem) => ({
        productId: item.id,
        name: item.name,
        code: item.code,
        price: item.price,
        gst: item.gst,
        quantity: item.cartQuantity,
        returnQuantity: returnQuantities[item.id] || 0
      }));
  }, [selectedTransaction, returnQuantities]);

  const refundAmount = useMemo(() => {
    return selectedItemsForReturn.reduce((total: number, item: ReturnItem) => {
      const itemTotal = item.price * item.returnQuantity;
      const gstAmount = (itemTotal * item.gst) / 100;
      return total + itemTotal + gstAmount;
    }, 0);
  }, [selectedItemsForReturn]);

  const handleProcessReturn = async () => {
    if (!selectedTransaction) {
      PWAUtils.showToast('No transaction selected', 'error');
      return;
    }

    if (selectedItemsForReturn.length === 0) {
      PWAUtils.showToast('Please select items to return', 'error');
      return;
    }

    try {
      // Process return
      const returnId = await addReturn(
        selectedTransaction.id,
        selectedTransaction.invoiceNumber,
        selectedItemsForReturn,
        returnReason
      );

      // Update inventory - add returned items back to stock
      for (const item of selectedItemsForReturn) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateProduct(product.id, {
            quantity: product.quantity + item.returnQuantity
          });
        }
      }

      PWAUtils.showToast('Return processed successfully!', 'success');
      
      // Reset form
      setSelectedTransaction(null);
      setInvoiceSearch('');
      setReturnQuantities({});
      setReturnReason('');
    } catch (error) {
      PWAUtils.showToast('Failed to process return', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Returns & Refunds</h1>
          <p className="text-muted-foreground">Process customer returns and refunds</p>
        </div>
        <Button
          onClick={() => setShowReturnsList(!showReturnsList)}
          variant="outline"
          className="flex items-center gap-2"
          data-testid="button-toggle-returns-list"
        >
          <i className={`fas fa-${showReturnsList ? 'plus' : 'list'}`}></i>
          {showReturnsList ? 'New Return' : 'View Returns'}
        </Button>
      </div>

      {!showReturnsList ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter invoice number (e.g., INV-1234567890123)"
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchInvoice()}
                    data-testid="input-invoice-search"
                  />
                </div>
                <Button
                  onClick={handleSearchInvoice}
                  className="flex items-center gap-2"
                  data-testid="button-search-invoice"
                >
                  <i className="fas fa-search"></i>
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedTransaction && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Number</p>
                      <p className="font-semibold">{selectedTransaction.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {new Date(selectedTransaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">{PWAUtils.formatCurrency(selectedTransaction.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Select Items to Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedTransaction.items.map((item: CartItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`return-item-${item.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.code}</p>
                          <p className="text-sm text-muted-foreground">
                            Sold Quantity: {item.cartQuantity} | Price: {PWAUtils.formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label htmlFor={`return-qty-${item.id}`} className="text-sm whitespace-nowrap">
                            Return Qty:
                          </Label>
                          <Input
                            id={`return-qty-${item.id}`}
                            type="number"
                            min="0"
                            max={item.cartQuantity}
                            value={returnQuantities[item.id] || 0}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-20"
                            data-testid={`input-return-qty-${item.id}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="return-reason">Reason for Return (Optional)</Label>
                    <Textarea
                      id="return-reason"
                      placeholder="Enter reason for return..."
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="mt-2"
                      data-testid="textarea-return-reason"
                    />
                  </div>
                </CardContent>
              </Card>

              {selectedItemsForReturn.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Return Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedItemsForReturn.map((item: ReturnItem) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span>{item.name} (x{item.returnQuantity})</span>
                          <span>{PWAUtils.formatCurrency(item.price * item.returnQuantity)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Refund Amount:</span>
                          <span className="text-primary" data-testid="text-refund-amount">
                            {PWAUtils.formatCurrency(refundAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleProcessReturn}
                      className="w-full mt-6"
                      data-testid="button-process-return"
                    >
                      <i className="fas fa-check-circle mr-2"></i>
                      Process Return & Refund
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Return History</CardTitle>
          </CardHeader>
          <CardContent>
            {allReturns.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return ID</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Refund Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReturns.map((returnRecord) => (
                      <TableRow key={returnRecord.id} data-testid={`return-row-${returnRecord.id}`}>
                        <TableCell className="font-medium">{returnRecord.id}</TableCell>
                        <TableCell>{returnRecord.invoiceNumber}</TableCell>
                        <TableCell>{new Date(returnRecord.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{returnRecord.returnedItems.length} item(s)</TableCell>
                        <TableCell className="font-semibold">
                          {PWAUtils.formatCurrency(returnRecord.refundAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{returnRecord.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-undo text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-foreground mb-2">No returns yet</h3>
                <p className="text-muted-foreground">Return history will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
