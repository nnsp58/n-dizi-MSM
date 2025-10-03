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
      '/alerts': 'Alerts & Notifications',
      '/subscription': 'Subscription',
      '/settings': 'Settings'
    };
    return titles[location] || 'Dashboard';
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile menu button - More prominent */}
        <Button 
          variant="outline" 
          size="icon" 
          className="lg:hidden border-2 border-primary/20 hover:border-primary hover:bg-primary/10"
          onClick={onMenuClick}
          data-testid="button-menu-toggle"
        >
          <i className="fas fa-bars text-2xl text-primary"></i>
        </Button>
        
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <i className="fas fa-store text-primary text-lg"></i>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-base">MSM</span>
            <span className="text-xs text-muted-foreground leading-tight">Multipurpose Store Management</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground hidden lg:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="lg:hidden relative"
        >
          <i className="fas fa-bell text-xl"></i>
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
          )}
        </Button>

        {/* Share button */}
        <Button 
          onClick={() => PWAUtils.shareApp()}
          variant="secondary"
          size="sm"
          className="hidden sm:flex items-center gap-2"
        >
          <i className="fas fa-share-alt"></i>
          <span className="hidden md:inline">Share App</span>
        </Button>

        {/* Logout button */}
        <Button 
          onClick={logout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
          data-testid="button-logout"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
