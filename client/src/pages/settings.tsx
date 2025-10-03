import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { useAuthStore } from '@/store/auth-store';
import { useFeedback } from '@/hooks/use-feedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PWAUtils } from '@/lib/pwa-utils';
import { SyncManager } from '@/lib/sync';
import InfoModal from '@/components/modals/info-modal';
import { STORE_TYPES, STORE_TYPE_LABELS, StoreType } from '@shared/schema';

const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeType: z.string().optional(),
  ownerName: z.string().min(1, 'Owner name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { forceFeedback } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [appSettings, setAppSettings] = useState({
    lowStockAlerts: true,
    expiryAlerts: true,
    autoSave: true,
  });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: React.ReactNode }>({ title: '', content: '' });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: user?.storeName || '',
      storeType: user?.storeType || 'general',
      ownerName: user?.ownerName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    setLoading(true);
    try {
      await updateUser(data);
      PWAUtils.showToast('Profile updated successfully', 'success');
    } catch (error) {
      PWAUtils.showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type: 'push' | 'pull' | 'bidirectional') => {
    if (!user) return;
    
    setSyncing(true);
    try {
      let result;
      switch (type) {
        case 'push':
          result = await SyncManager.pushToCloud(user);
          break;
        case 'pull':
          result = await SyncManager.pullFromCloud(user);
          break;
        case 'bidirectional':
          result = await SyncManager.bidirectionalSync(user);
          break;
      }
      
      if (result.success) {
        PWAUtils.showToast(result.message, 'success');
        if (result.syncedAt) {
          await updateUser({ lastSyncAt: result.syncedAt });
        }
      } else {
        PWAUtils.showToast(result.message, 'error');
      }
    } catch (error: any) {
      PWAUtils.showToast('Sync failed: ' + error.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const openInfoModal = (type: string) => {
    const content = getInfoContent(type);
    setInfoModalContent(content);
    setShowInfoModal(true);
  };

  const getInfoContent = (type: string) => {
    const contents = {
      about: {
        title: 'About n-dizi Store Manager',
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About Our App</h3>
            <p>
              n-dizi Store Manager is a comprehensive offline-first PWA designed to help small shop owners 
              manage their inventory, sales, and customer transactions efficiently.
            </p>
            <h4 className="font-semibold">Key Features:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Inventory Management with QR/Barcode scanning</li>
              <li>Point of Sale system with invoice generation</li>
              <li>Sales reports and analytics</li>
              <li>Low stock and expiry alerts</li>
              <li>Works completely offline</li>
              <li>Data export to Excel</li>
              <li>PWA installation support</li>
            </ul>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Version:</strong> 1.0.0<br />
                <strong>Developed by:</strong> n-dizi<br />
                <strong>Support:</strong> support@n-dizi.com
              </p>
            </div>
          </div>
        )
      },
      howto: {
        title: 'How to Use',
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Getting Started Guide</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">1. Adding Inventory</h4>
                <p className="text-sm text-muted-foreground">
                  Use the QR/Barcode scanner or manual entry to add products. 
                  Set quantities, prices, GST rates, and stock thresholds.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">2. Making Sales</h4>
                <p className="text-sm text-muted-foreground">
                  Go to POS, scan or search products, add to cart, and generate invoices. 
                  PDFs are automatically created with GST calculations.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">3. Managing Stock</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor low stock alerts, track expiry dates, and request new stock 
                  via email integration.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">4. Viewing Reports</h4>
                <p className="text-sm text-muted-foreground">
                  Check daily/monthly sales, export data to Excel, and analyze 
                  business performance.
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>💡 Tip:</strong> The app works completely offline. Your data is stored 
                locally and secure.
              </p>
            </div>
          </div>
        )
      },
      privacy: {
        title: 'Privacy Policy',
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Privacy Policy</h3>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Data Collection</h4>
                <p className="text-sm">
                  n-dizi Store Manager is committed to protecting your privacy. All your data 
                  is stored locally on your device using IndexedDB. We do not collect, store, 
                  or transmit any personal data to external servers.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Local Storage</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>All data is stored locally on your device</li>
                  <li>No cloud backup or synchronization (in Free plan)</li>
                  <li>You have full control over your data</li>
                  <li>Data can be exported anytime</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold">Third-Party Services</h4>
                <p className="text-sm">
                  We use minimal third-party services only for functionality (fonts, icons). 
                  No analytics or tracking services are integrated.
                </p>
              </div>
            </div>
          </div>
        )
      },
      terms: {
        title: 'Terms & Conditions',
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Terms & Conditions</h3>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Acceptance of Terms</h4>
                <p className="text-sm">
                  By using n-dizi Store Manager, you agree to these terms and conditions.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Service Description</h4>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>The app is provided "as is" without warranties</li>
                  <li>You are responsible for backing up your data</li>
                  <li>Free plan includes basic features with invoice watermark</li>
                  <li>Premium features will be available via subscription</li>
                  <li>We reserve the right to modify features and pricing</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold">User Responsibilities</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Ensure data accuracy and backup</li>
                  <li>Use the app in compliance with local laws</li>
                  <li>Report bugs or issues for improvement</li>
                </ul>
              </div>
            </div>
          </div>
        )
      },
      faq: {
        title: 'Frequently Asked Questions',
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Q: Does this work offline?</h4>
                <p className="text-sm text-muted-foreground">
                  A: Yes! All features work completely offline. Data is stored securely on your device.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Q: Can I export my data?</h4>
                <p className="text-sm text-muted-foreground">
                  A: Yes, you can export inventory and transaction data to Excel format anytime.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Q: How do I scan barcodes?</h4>
                <p className="text-sm text-muted-foreground">
                  A: Use your device camera for QR codes or connect an external barcode scanner.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Q: What's included in the Free plan?</h4>
                <p className="text-sm text-muted-foreground">
                  A: All core features including inventory, POS, reports, and alerts. Invoices include a watermark.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Q: How secure is my data?</h4>
                <p className="text-sm text-muted-foreground">
                  A: Very secure. All data stays on your device and is never transmitted to external servers.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Q: Can I install this as an app?</h4>
                <p className="text-sm text-muted-foreground">
                  A: Yes! It's a PWA (Progressive Web App). Look for "Add to Home Screen" in your browser.
                </p>
              </div>
            </div>
          </div>
        )
      }
    };
    
    return contents[type as keyof typeof contents] || { title: 'Information', content: <div>Content not found</div> };
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

        {/* Profile Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name *</Label>
                  <Input
                    id="storeName"
                    {...form.register('storeName')}
                  />
                  {form.formState.errors.storeName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.storeName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    {...form.register('ownerName')}
                  />
                  {form.formState.errors.ownerName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.ownerName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Store Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(STORE_TYPE_LABELS).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => form.setValue('storeType', type)}
                      data-testid={`button-store-type-${type}`}
                      className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        form.watch('storeType') === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">
                          {type === 'medical' && '💊'}
                          {type === 'provision' && '🛒'}
                          {type === 'retail' && '🏪'}
                          {type === 'general' && '🏬'}
                        </div>
                        {label}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose your store type to get relevant product units (kg, ltr, tablets, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 1234567890"
                  {...form.register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  placeholder="Store address for invoices..."
                  {...form.register('address')}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cloud Sync */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cloud Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                {user?.lastSyncAt 
                  ? `Last synced: ${new Date(user.lastSyncAt).toLocaleString()}`
                  : 'Never synced to cloud'}
              </p>
              <p className="text-xs text-muted-foreground">
                Backup your data to the cloud and access it from any device.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={() => handleSync('push')}
                disabled={syncing}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <i className="fas fa-cloud-upload-alt text-2xl text-primary"></i>
                <span className="font-medium">Push to Cloud</span>
                <span className="text-xs text-muted-foreground">Upload local data</span>
              </Button>

              <Button
                onClick={() => handleSync('pull')}
                disabled={syncing}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <i className="fas fa-cloud-download-alt text-2xl text-primary"></i>
                <span className="font-medium">Pull from Cloud</span>
                <span className="text-xs text-muted-foreground">Download cloud data</span>
              </Button>

              <Button
                onClick={() => handleSync('bidirectional')}
                disabled={syncing}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <i className="fas fa-sync-alt text-2xl"></i>
                <span className="font-medium">Full Sync</span>
                <span className="text-xs text-muted-foreground">
                  {syncing ? 'Syncing...' : 'Two-way sync'}
                </span>
              </Button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <i className="fas fa-info-circle mr-2"></i>
                Cloud sync requires an internet connection and a registered account.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when products are low</p>
              </div>
              <Switch
                checked={appSettings.lowStockAlerts}
                onCheckedChange={(checked) => 
                  setAppSettings(prev => ({ ...prev, lowStockAlerts: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Expiry Alerts</p>
                <p className="text-sm text-muted-foreground">Alert for expiring products</p>
              </div>
              <Switch
                checked={appSettings.expiryAlerts}
                onCheckedChange={(checked) => 
                  setAppSettings(prev => ({ ...prev, expiryAlerts: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Auto-save Invoices</p>
                <p className="text-sm text-muted-foreground">Automatically save generated invoices</p>
              </div>
              <Switch
                checked={appSettings.autoSave}
                onCheckedChange={(checked) => 
                  setAppSettings(prev => ({ ...prev, autoSave: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Help & Resources */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Help & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => openInfoModal('howto')}
                variant="outline"
                className="p-4 h-auto flex flex-col items-start text-left"
              >
                <i className="fas fa-question-circle text-primary text-2xl mb-2"></i>
                <p className="font-medium text-foreground">How to Use</p>
                <p className="text-sm text-muted-foreground">Learn app features</p>
              </Button>
              
              <Button
                onClick={() => openInfoModal('faq')}
                variant="outline"
                className="p-4 h-auto flex flex-col items-start text-left"
              >
                <i className="fas fa-comments text-primary text-2xl mb-2"></i>
                <p className="font-medium text-foreground">FAQ</p>
                <p className="text-sm text-muted-foreground">Common questions</p>
              </Button>
              
              <Button
                onClick={() => openInfoModal('about')}
                variant="outline"
                className="p-4 h-auto flex flex-col items-start text-left"
              >
                <i className="fas fa-info-circle text-primary text-2xl mb-2"></i>
                <p className="font-medium text-foreground">About</p>
                <p className="text-sm text-muted-foreground">App information</p>
              </Button>
              
              <Link href="/feedback">
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-start text-left w-full"
                  data-testid="button-goto-feedback"
                >
                  <i className="fas fa-star text-primary text-2xl mb-2"></i>
                  <p className="font-medium text-foreground">Give Feedback</p>
                  <p className="text-sm text-muted-foreground">Share your thoughts</p>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle>Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => openInfoModal('privacy')}
              variant="ghost"
              className="w-full justify-between p-4 h-auto"
            >
              <span className="font-medium text-foreground">Privacy Policy</span>
              <i className="fas fa-chevron-right text-muted-foreground"></i>
            </Button>
            
            <Button
              onClick={() => openInfoModal('terms')}
              variant="ghost"
              className="w-full justify-between p-4 h-auto"
            >
              <span className="font-medium text-foreground">Terms & Conditions</span>
              <i className="fas fa-chevron-right text-muted-foreground"></i>
            </Button>
          </CardContent>
        </Card>
      </div>

      <InfoModal
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
        title={infoModalContent.title}
      >
        {infoModalContent.content}
      </InfoModal>
    </div>
  );
}
