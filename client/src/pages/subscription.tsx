import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';

export default function Subscription() {
  const { user } = useAuthStore();

  const freePlanFeatures = [
    { feature: 'Up to unlimited products', included: true },
    { feature: 'Basic inventory management', included: true },
    { feature: 'Invoice generation with watermark', included: true },
    { feature: 'Sales reports', included: true },
    { feature: 'QR/Barcode scanning', included: true },
    { feature: 'Offline functionality', included: true },
    { feature: 'No watermark on invoices', included: false },
    { feature: 'Cloud sync & backup', included: false },
    { feature: 'Multi-user access', included: false },
    { feature: 'Advanced analytics', included: false },
    { feature: 'Priority support', included: false },
    { feature: 'Custom branding', included: false },
  ];

  const premiumFeatures = [
    { icon: 'fas fa-infinity', title: 'Unlimited Products', description: 'No limits on inventory size' },
    { icon: 'fas fa-file-invoice', title: 'No Watermark', description: 'Clean, professional invoices' },
    { icon: 'fas fa-cloud', title: 'Cloud Sync', description: 'Backup and sync across devices' },
    { icon: 'fas fa-users', title: 'Multi-user Access', description: 'Team collaboration features' },
    { icon: 'fas fa-chart-bar', title: 'Advanced Analytics', description: 'Detailed business insights' },
    { icon: 'fas fa-headset', title: 'Priority Support', description: '24/7 dedicated assistance' },
    { icon: 'fas fa-palette', title: 'Custom Branding', description: 'Personalize with your brand' },
    { icon: 'fas fa-mobile-alt', title: 'Mobile Apps', description: 'Native iOS and Android apps' },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Plan</h1>
          <p className="text-muted-foreground">Choose the plan that fits your business needs</p>
        </div>

        {/* Current Plan */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl font-bold text-foreground">Free Plan</CardTitle>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <p className="text-muted-foreground">Your current subscription</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">₹0</p>
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
                {freePlanFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <i className={`fas ${item.included ? 'fa-check text-green-600' : 'fa-times text-muted-foreground'}`}></i>
                    <span className={item.included ? '' : 'text-muted-foreground'}>{item.feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <i className="fas fa-calendar"></i>
              <span>No expiry date • Free forever</span>
            </div>
          </CardContent>
        </Card>

        {/* Premium Plan Preview */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-8 text-white mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-crown text-3xl"></i>
            </div>
            <h2 className="text-3xl font-bold mb-3">Premium Plans Coming Soon!</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              We're working on bringing you premium features with Razorpay integration. 
              Stay tuned for exciting updates that will transform your business operations!
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-center">
                <i className={`${feature.icon} text-2xl mb-3`}></i>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-white/80">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Razorpay Integration Notice */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <i className="fas fa-credit-card text-2xl"></i>
              <h3 className="text-xl font-bold">Secure Payment Integration</h3>
            </div>
            <p className="text-white/90 mb-4">
              Premium subscriptions will be powered by Razorpay for secure, seamless payments. 
              Multiple payment methods including UPI, cards, and net banking will be supported.
            </p>
            <Button 
              className="bg-white text-primary hover:bg-white/90"
              disabled
            >
              <i className="fas fa-bell mr-2"></i>
              Notify Me When Available
            </Button>
          </div>
        </div>

        {/* Current Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Store Name</label>
                <p className="font-semibold text-foreground">{user?.storeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                <p className="font-semibold text-foreground">{user?.ownerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="font-semibold text-foreground">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plan</label>
                <div className="flex items-center gap-2">
                  <Badge>Free</Badge>
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
