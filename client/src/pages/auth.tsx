import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PWAUtils } from '@/lib/pwa-utils';
import { STORE_TYPE_LABELS } from '@shared/schema';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    storeName: '',
    storeType: 'general',
    ownerName: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let success = false;
      
      if (isLogin) {
        success = await login(formData.email, formData.password);
      } else {
        if (!formData.storeName || !formData.ownerName) {
          PWAUtils.showToast('Please fill all required fields', 'error');
          setLoading(false);
          return;
        }
        success = await signup(formData);
      }

      if (success) {
        PWAUtils.showToast(isLogin ? 'Login successful!' : 'Account created successfully!', 'success');
      } else {
        PWAUtils.showToast(isLogin ? 'Invalid credentials' : 'Email already exists', 'error');
      }
    } catch (error) {
      PWAUtils.showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(271 76% 53%) 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <i className="fas fa-store text-4xl text-primary"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">n-dizi Store Manager</h1>
          <p className="text-white/90 text-sm">Complete shop management solution</p>
        </div>

        <Card className="bg-white rounded-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your account' : 'Set up your store account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      type="text"
                      placeholder="Kanha Medical Store"
                      value={formData.storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      required={!isLogin}
                      data-testid="input-storename"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Store Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(STORE_TYPE_LABELS).map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleInputChange('storeType', type)}
                          data-testid={`button-signup-store-type-${type}`}
                          className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                            formData.storeType === type
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-lg mb-0.5">
                              {type === 'medical' && '💊'}
                              {type === 'provision' && '🛒'}
                              {type === 'retail' && '🏪'}
                              {type === 'general' && '🏬'}
                            </div>
                            <div className="text-[10px] leading-tight">{label}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select your store type to get relevant product units
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Your Name *</Label>
                    <Input
                      id="ownerName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      required={!isLogin}
                      data-testid="input-ownername"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 1234567890"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Store address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid={isLogin ? "button-signin" : "button-signup"}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-semibold hover:underline"
                  type="button"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">Presented by <span className="font-semibold">n-dizi</span></p>
        </div>
      </div>
    </div>
  );
}
