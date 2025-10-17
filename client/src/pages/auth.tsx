import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PWAUtils } from "@/lib/pwa-utils";
import { t } from "@/lib/i18n";
import { STORE_TYPE_LABELS } from "@shared/schema";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    storeName: "",
    storeType: "general",
    ownerName: "",
    phone: "",
    address: "",
  });

  const handleInputChange = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let success = false;
      if (isLogin) {
        success = await login(formData.email, formData.password);
      } else {
        if (!formData.storeName || !formData.ownerName) {
          PWAUtils.showToast("Please fill all required fields", "error");
          return;
        }
        success = await signup(formData);
      }
      if (success) {
        PWAUtils.showToast(isLogin ? "Login successful!" : "Account created successfully!", "success");
      } else {
        PWAUtils.showToast(isLogin ? "Invalid credentials" : "Email already exists", "error");
      }
    } catch {
      PWAUtils.showToast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.email) {
        PWAUtils.showToast("Please enter your email", "error");
        return;
      }
      const { error } = await window.supabase.auth.resetPasswordForEmail(formData.email);
      if (!error) {
        PWAUtils.showToast("Password reset link sent to your email!", "success");
        setIsForgotPassword(false);
      } else {
        PWAUtils.showToast("Email not found or invalid", "error");
      }
    } catch {
      PWAUtils.showToast("Failed to send reset link. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #3b82f6 0%, #7e22ce 100%)" }}>
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-lg mb-4 overflow-hidden">
            <img src="/mono.png" alt="n-dizi.in"
              className="w-20 h-20 object-contain" onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = '/fallback-logo.svg' }}ntain"
              style={{
                filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))",
                animation: "float 3s ease-in-out infinite",
              }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">n-dizi Store Manager</h1>
          <p className="text-white/90 text-sm">Complete shop management solution</p>
        </div>

        <Card className="bg-white rounded-xl shadow-2xl relative">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isForgotPassword ? "Reset Password" : isLogin ? "{t("welcomeBack")}" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isLogin
                ? "{t("signInToAccount")}"
                : "Set up your store account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Label>Email *</Label>
                <Input type="email" placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button type="button" variant="ghost" className="w-full"
                  onClick={() => setIsForgotPassword(false)}>
                  ← Back to Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 relative">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label>Store Name *</Label>
                      <Input placeholder="Narayan Digital Hub"
                        value={formData.storeName}
                        onChange={(e) => handleInputChange("storeName", e.target.value)}
                        required />
                    </div>
                    <div className="space-y-2">
                      <Label>Store Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(STORE_TYPE_LABELS).map(([type, label]) => (
                          <button key={type} type="button"
                            onClick={() => handleInputChange("storeType", type)}
                            className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                              formData.storeType === type
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            }`}>
                            <div className="text-center">
                              <div className="text-lg mb-0.5">
                                {type === "medical" && "💊"}
                                {type === "provision" && "🛒"}
                                {type === "retail" && "🏪"}
                                {type === "general" && "🏬"}
                                {type === "digital" && "💻"}
                              </div>
                              <div className="text-[10px] leading-tight">{label}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Your Name *</Label>
                      <Input placeholder="John Doe"
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange("ownerName", e.target.value)}
                        required />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required />
                </div>

                <div className="space-y-2 relative">
                  <Label>Password *</Label>
                  <Input type="password" placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required />
                  {isLogin && (
                    <button type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="absolute right-2 top-8 text-xs text-blue-600 font-semibold hover:underline">
                      Forgot Password?
                    </button>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : isLogin ? "{t("signIn")}" : "Create Account"}
                </Button>
              </form>
            )}

            {!isForgotPassword && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFormData({
                        email: "", password: "", storeName: "", storeType: "general", ownerName: "", phone: "", address: ""
                      });
                    }}
                    className="text-primary font-semibold hover:underline">
                    {isLogin ? "{t("signUp")}" : "{t("signIn")}"}
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">Presented by <span className="font-semibold">n-dizi</span></p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
                }
