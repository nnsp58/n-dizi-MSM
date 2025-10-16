import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useAlerts } from '@/hooks/use-alerts';
import { PWAUtils } from '@/lib/pwa-utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [location] = useLocation();
  const { logout } = useAuthStore();
  const { totalAlerts } = useAlerts();

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      '/': 'Dashboard',
      '/inventory': 'Inventory Management',
      '/pos': 'Point of Sale',
      '/reports': 'Sales Reports',
      '/returns': 'Returns & Refunds',
      '/alerts': 'Alerts & Notifications',
      '/operators': 'Operator Management',
      '/subscription': 'Subscription Plans',
      '/settings': 'Settings',
      '/admin/dashboard': 'Admin Dashboard',
      '/admin/feedback': 'Feedback Management'
    };
    return titles[location] || 'Dashboard';
  };

  const getPageIcon = () => {
    const icons: { [key: string]: string } = {
      '/': 'fa-home',
      '/inventory': 'fa-boxes',
      '/pos': 'fa-cash-register',
      '/reports': 'fa-chart-line',
      '/returns': 'fa-undo',
      '/alerts': 'fa-bell',
      '/operators': 'fa-users',
      '/subscription': 'fa-crown',
      '/settings': 'fa-cog',
      '/admin/dashboard': 'fa-chart-pie',
      '/admin/feedback': 'fa-comments'
    };
    return icons[location] || 'fa-home';
  };

  const handleAlertsClick = () => {
    window.location.href = '/alerts';
  };

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden border-2 border-primary/20 hover:border-primary hover:bg-primary/10 transition-all"
          onClick={onMenuClick}
          data-testid="button-menu-toggle"
        >
          <i className="fas fa-bars text-xl text-primary"></i>
        </Button>

        {/* N-Dizi Animated Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="/n-dizi-MSM/mono.png" 
              alt="n-dizi.in" 
              className="w-12 h-12 object-contain animate-pulse hover:animate-spin transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))',
                animation: 'float 3s ease-in-out infinite'
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-base leading-tight">n-dizi.in</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Store Management</span>
          </div>
        </div>

        {/* Desktop Page Title with Icon */}
        <div className="hidden lg:flex items-center gap-3">
          {/* N-Dizi Logo on Desktop */}
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="/n-dizi-MSM/mono.png" 
              alt="n-dizi.in" 
              className="w-10 h-10 object-contain animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))',
                animation: 'float 3s ease-in-out infinite'
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Button - Mobile */}
        <Button
          onClick={handleAlertsClick}
          variant="ghost"
          size="icon"
          className="lg:hidden relative hover:bg-primary/10"
        >
          <i className="fas fa-bell text-lg"></i>
          {totalAlerts > 0 && (
            <>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold z-10">
                {totalAlerts > 9 ? '9+' : totalAlerts}
              </span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
            </>
          )}
        </Button>

        {/* Alerts Badge - Desktop */}
        {totalAlerts > 0 && (
          <Button
            onClick={handleAlertsClick}
            variant="outline"
            size="sm"
            className="hidden lg:flex items-center gap-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600"
          >
            <i className="fas fa-bell animate-pulse"></i>
            <span className="font-semibold">
              {totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}
            </span>
          </Button>
        )}

        {/* Share button */}
        <Button
          onClick={() => PWAUtils.shareApp()}
          variant="secondary"
          size="sm"
          className="hidden sm:flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <i className="fas fa-share-alt"></i>
          <span className="hidden md:inline">Share</span>
        </Button>

        {/* Logout button */}
        <Button
          onClick={logout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>

      {/* CSS Animation for floating effect */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </header>
  );
          }
