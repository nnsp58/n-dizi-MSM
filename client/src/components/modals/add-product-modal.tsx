import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventoryStore } from '@/store/inventory-store';
import { useAuthStore } from '@/store/auth-store';
import { PWAUtils } from '@/lib/pwa-utils';
import ScannerModal from './scanner-modal';
import { UNIT_CATALOG, STORE_TYPES, StoreType } from '@shared/schema';

const productSchema = z.object({
  code: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  category: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  unit: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  gst: z.number().min(0).max(100, 'GST must be between 0 and 100'),
  lowStockThreshold: z.number().min(0).optional(),
  expiry: z.string().optional(),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: any; // Product to edit
}

export default function AddProductModal({ open, onOpenChange, editProduct }: AddProductModalProps) {
  const { addProduct, updateProduct, getProductByCode } = useInventoryStore();
  const { user } = useAuthStore();
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'qr' | 'barcode'>('qr');
  const [loading, setLoading] = useState(false);
  
  // Get available units based on store type
  const storeType = (user?.storeType || 'general') as StoreType;
  const availableUnits = UNIT_CATALOG[storeType] || UNIT_CATALOG.general;

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      name: '',
      category: '',
      quantity: 0,
      unit: 'pieces',
      price: 0,
      gst: 18,
      lowStockThreshold: 10,
      expiry: '',
      description: '',
    },
  });

  useEffect(() => {
    if (editProduct) {
      form.reset({
        code: editProduct.code,
        name: editProduct.name,
        category: editProduct.category || '',
        quantity: editProduct.quantity,
        unit: editProduct.unit || 'pieces',
        price: editProduct.price,
        gst: editProduct.gst,
        lowStockThreshold: editProduct.lowStockThreshold || 10,
        expiry: editProduct.expiry || '',
        description: editProduct.description || '',
      });
    } else {
      form.reset({
        code: '',
        name: '',
        category: '',
        quantity: 0,
        unit: 'pieces',
        price: 0,
        gst: 18,
        lowStockThreshold: 10,
        expiry: '',
        description: '',
      });
    }
  }, [editProduct, form, open]);

  const onSubmit = async (data: ProductForm) => {
    setLoading(true);
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, data);
        PWAUtils.showToast('Product updated successfully', 'success');
      } else {
        // Check if product with same code already exists
        const existingProduct = getProductByCode(data.code);
        if (existingProduct) {
          PWAUtils.showToast('Product with this code already exists', 'error');
          setLoading(false);
          return;
        }
        
        await addProduct(data);
        PWAUtils.showToast('Product added successfully', 'success');
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      PWAUtils.showToast('Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openScanner = (type: 'qr' | 'barcode') => {
    setScannerType(type);
    setShowScanner(true);
  };

  const handleScanComplete = (result: { code: string }) => {
    form.setValue('code', result.code);
    setShowScanner(false);
    
    // Check if product exists and auto-fill
    const existingProduct = getProductByCode(result.code);
    if (existingProduct) {
      form.reset({
        code: existingProduct.code,
        name: existingProduct.name,
        category: existingProduct.category || '',
        quantity: existingProduct.quantity,
        unit: existingProduct.unit || 'pieces',
        price: existingProduct.price,
        gst: existingProduct.gst,
        lowStockThreshold: existingProduct.lowStockThreshold || 10,
        expiry: existingProduct.expiry || '',
        description: existingProduct.description || '',
      });
      PWAUtils.showToast('Product found! Details auto-filled.', 'info');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          {/* Scan Options */}
          {!editProduct && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                type="button"
                onClick={() => openScanner('qr')}
                variant="outline"
                className="p-4 h-auto flex flex-col items-center gap-2 border-2 border-primary hover:bg-primary/5"
              >
                <i className="fas fa-qrcode text-primary text-3xl"></i>
                <span className="font-medium text-foreground">Scan QR Code</span>
              </Button>
              <Button
                type="button"
                onClick={() => openScanner('barcode')}
                variant="outline"
                className="p-4 h-auto flex flex-col items-center gap-2 border-2 border-secondary hover:bg-secondary/5"
              >
                <i className="fas fa-barcode text-secondary text-3xl"></i>
                <span className="font-medium text-foreground">Scan Barcode</span>
              </Button>
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                {editProduct ? 'EDIT DETAILS' : 'OR ENTER MANUALLY'}
              </span>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Product Code/Barcode *</Label>
                <Input
                  id="code"
                  placeholder="8901234567890"
                  {...form.register('code')}
                />
                {form.formState.errors.code && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Paracetamol 500mg"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={form.watch('category')} 
                  onValueChange={(value) => form.setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medicines">Medicines</SelectItem>
                    <SelectItem value="Supplements">Supplements</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Personal Care">Personal Care</SelectItem>
                    <SelectItem value="First Aid">First Aid</SelectItem>
                    <SelectItem value="Baby Care">Baby Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="100"
                  {...form.register('quantity', { valueAsNumber: true })}
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.quantity.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select 
                value={form.watch('unit')} 
                onValueChange={(value) => form.setValue('unit', value)}
              >
                <SelectTrigger data-testid="select-unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit} value={unit} data-testid={`unit-option-${unit}`}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Units available for your store type
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  {...form.register('price', { valueAsNumber: true })}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst">GST (%) *</Label>
                <Select
                  value={form.watch('gst')?.toString()}
                  onValueChange={(value) => form.setValue('gst', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  {...form.register('expiry')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  placeholder="10"
                  {...form.register('lowStockThreshold', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Additional product details..."
                {...form.register('description')}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : (editProduct ? 'Update Product' : 'Add Product')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ScannerModal
        open={showScanner}
        onOpenChange={setShowScanner}
        scanType={scannerType}
        onScanComplete={handleScanComplete}
      />
    </>
  );
}
