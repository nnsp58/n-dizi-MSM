import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PWAUtils } from '@/lib/pwa-utils';
import { STORE_TYPE_LABELS } from '@shared/schema'; // ✅ ensure correct path

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
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
      console.error(error);
      PWAUtils.showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.email) {
        PWAUtils.showToast('Please enter your email', 'error');
        return;
      }

      const { error } = await window.supabase.auth.resetPasswordForEmail(formData.email);
      if (!error) {
        PWAUtils.showToast('Password reset link sent to your email!', 'success');
        setIsForgotPassword(false);
      } else {
        PWAUtils.showToast('Email not found or invalid', 'error');
      }
    } catch (err) {
      console.error(err);
      PWAUtils.showToast('Failed to send reset link. Please try again.', 'error');
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
        {/* Branding Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-lg mb-4 overflow-hidden">
            <img
              src="/mono.png"
              alt="n-dizi.in"
              className="w-20 h-20 object-contain"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                animation: 'float 3s ease-in-out infinite'
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">n-dizi Store Manager</h1>
          <p className="text-white/90 text-sm">Complete shop management solution</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-white rounded-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? 'Enter your email to receive a password reset link'
                : (isLogin ? 'Sign in to your account' : 'Set up your store account')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isForgotPassword ? (
              // 🔹 Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsForgotPassword(false)}
                >
                  ← Back to Login
                </Button>
              </form>
            ) : (
              // 🔹 Login / Signup Form
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name *</Label>
                      <Input
                        id="storeName"
                        type="text"
                        placeholder="Narayan Digital Hub"  // ✅ updated default name
                        value={formData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        required={!isLogin}
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
                                {type === 'digital' && '💻'} {/* ✅ added digital icon */}
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
                    value={formDa
