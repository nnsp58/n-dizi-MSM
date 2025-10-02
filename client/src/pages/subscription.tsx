import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Subscription() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const freePlanFeatures = [
    { feature: 'Up to unlimited products', included: true },
    { feature: 'Basic inventory management', included: true },
    { feature: 'Invoice generation with watermark', included: true },
    { feature: 'Sales reports', included: true },
    { feature: 'QR/Barcode scanning', included: true },
    { feature: 'Offline functionality', included: true },
    { feature: 'No watermark on invoices', included: false },
    { feature: 'Cloud sync & backup', included: false },
    { feature: 'Multi-store support', included: false },
    { feature: 'Advanced analytics', included: false },
    { feature: 'Priority support', included: false },
    { feature: 'Custom branding', included: false },
  ];

  const premiumFeatures = [
    { icon: 'fas fa-infinity', title: 'Unlimited Products', description: 'No limits on inventory size' },
    { icon: 'fas fa-file-invoice', title: 'No Watermark', description: 'Clean, professional invoices' },
    { icon: 'fas fa-cloud', title: 'Cloud Sync', description: 'Backup and sync across devices' },
    { icon: 'fas fa-store', title: 'Multi-store Support', description: 'Manage multiple locations' },
    { icon: 'fas fa-chart-bar', title: 'Advanced Analytics', description: 'Detailed business insights' },
    { icon: 'fas fa-headset', title: 'Priority Support', description: '24/7 dedicated assistance' },
    { icon: 'fas fa-palette', title: 'Custom Branding', description: 'Personalize with your brand' },
    { icon: 'fas fa-mobile-alt', title: 'Mobile Apps', description: 'Native iOS and Android apps' },
  ];

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Please log in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const res = await apiRequest('POST', '/api/subscription/checkout', { plan });
      const response = await res.json();

      const { orderId, amount, currency, keyId } = response;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'n-dizi Store Manager',
        description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Premium Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiRequest('POST', '/api/subscription/verify', {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            const verifyResponse = await verifyRes.json();

            if (verifyResponse.success) {
              toast({
                title: 'Success!',
                description: 'Subscription activated successfully',
              });
              
              setTimeout(() => {
                window.location.href = '/subscription';
              }, 1500);
            }
          } catch (error: any) {
            toast({
              title: 'Verification Failed',
              description: error.message || 'Please contact support',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: user.ownerName,
          email: user.email,
          contact: user.phone || '',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response: any) {
        toast({
          title: 'Payment Failed',
          description: response.error.description,
          variant: 'destructive',
        });
        setIsProcessing(false);
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const isPro = user?.plan === 'pro';

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Plan</h1>
          <p className="text-muted-foreground">Choose the plan that fits your business needs</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {isPro ? 'Premium Plan' : 'Free Plan'}
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800" data-testid="badge-plan-status">Active</Badge>
                </div>
                <p className="text-muted-foreground">Your current subscription</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground" data-testid="text-plan-price">
                  {isPro ? '₹299' : '₹0'}
                </p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-info-circle text-primary"></i>
                <p className="font-medium text-foreground">Plan Features</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                {freePlanFeatures.map((item, index) => {
                  const included = isPro ? true : item.included;
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <i className={`fas ${included ? 'fa-check text-green-600' : 'fa-times text-muted-foreground'}`}></i>
                      <span className={included ? '' : 'text-muted-foreground'}>{item.feature}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <i className="fas fa-calendar"></i>
              <span data-testid="text-plan-expiry">
                {isPro && user?.subscriptionEndsAt 
                  ? `Expires on ${new Date(user.subscriptionEndsAt).toLocaleDateString()}`
                  : 'No expiry date • Free forever'}
              </span>
            </div>
          </CardContent>
        </Card>

        {!isPro && (
          <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-8 text-white mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-crown text-3xl"></i>
              </div>
              <h2 className="text-3xl font-bold mb-3">Upgrade to Premium</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Unlock advanced features and take your business to the next level
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-center">
                  <i className={`${feature.icon} text-2xl mb-3`}></i>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-white/80">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Choose Your Plan</h3>
                <p className="text-white/90 text-sm">
                  Secure payment powered by Razorpay
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-6 text-center">
                  <h4 className="text-lg font-bold mb-2">Monthly</h4>
                  <p className="text-3xl font-bold mb-1">₹299</p>
                  <p className="text-sm text-white/80 mb-4">per month</p>
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    onClick={() => handleSubscribe('monthly')}
                    disabled={isProcessing}
                    data-testid="button-subscribe-monthly"
                  >
                    {isProcessing ? 'Processing...' : 'Subscribe Monthly'}
                  </Button>
                </div>

                <div className="bg-white/10 rounded-lg p-6 text-center border-2 border-white/50">
                  <Badge className="mb-2 bg-yellow-500 text-white">Save 17%</Badge>
                  <h4 className="text-lg font-bold mb-2">Yearly</h4>
                  <p className="text-3xl font-bold mb-1">₹2,999</p>
                  <p className="text-sm text-white/80 mb-4">per year (₹250/month)</p>
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    onClick={() => handleSubscribe('yearly')}
                    disabled={isProcessing}
                    data-testid="button-subscribe-yearly"
                  >
                    {isProcessing ? 'Processing...' : 'Subscribe Yearly'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Store Name</label>
                <p className="font-semibold text-foreground" data-testid="text-store-name">{user?.storeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                <p className="font-semibold text-foreground" data-testid="text-owner-name">{user?.ownerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="font-semibold text-foreground" data-testid="text-email">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plan</label>
                <div className="flex items-center gap-2">
                  <Badge data-testid="badge-plan-type">{isPro ? 'Premium' : 'Free'}</Badge>
                  <span className="text-sm text-muted-foreground">• Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
