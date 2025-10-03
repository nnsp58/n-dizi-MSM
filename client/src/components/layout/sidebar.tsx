import { Link, useLocation } from 'wouter';
import { useAuthStore } from '@/store/auth-store';
import { useAlerts } from '@/hooks/use-alerts';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuthStore();
  const { totalAlerts } = useAlerts();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'fas fa-home' },
    { name: 'Inventory', href: '/inventory', icon: 'fas fa-boxes' },
    { name: 'Point of Sale', href: '/pos', icon: 'fas fa-cash-register' },
    { name: 'Reports', href: '/reports', icon: 'fas fa-chart-line' },
    { name: 'Returns & Refunds', href: '/returns', icon: 'fas fa-undo' },
    { name: 'Alerts', href: '/alerts', icon: 'fas fa-bell', badge: totalAlerts > 0 ? totalAlerts : undefined },
    { name: 'Operators', href: '/operators', icon: 'fas fa-users' },
    { name: 'Subscription', href: '/subscription', icon: 'fas fa-crown' },
    { name: 'Settings', href: '/settings', icon: 'fas fa-cog' }
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          data-testid="overlay-sidebar"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        data-testid="sidebar-nav"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-card border-r border-border h-screen lg:!transform-none transition-transform duration-300 ease-in-out"
      >
        {/* Close button for mobile */}
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            <i className="fas fa-times text-xl"></i>
          </Button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-store text-white text-lg"></i>
          </div>
          <div>
            <h1 className="font-bold text-foreground">MSM</h1>
            <p className="text-xs text-muted-foreground">Multipurpose Store Management</p>
          </div>
        </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href} onClick={() => {
            onClose();
          }}>
            <button
              data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                isActive(item.href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <i className={`${item.icon} w-5`}></i>
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {user ? getInitials(user.ownerName) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">
              {user?.ownerName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            logout();
            onClose();
          }}
          variant="outline"
          size="sm"
          className="w-full"
          data-testid="button-logout-sidebar"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </Button>
      </div>
    </aside>
    </>
  );
}
