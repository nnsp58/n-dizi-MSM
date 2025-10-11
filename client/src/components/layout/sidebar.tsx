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
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: 'fas fa-home',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      name: 'Inventory', 
      href: '/inventory', 
      icon: 'fas fa-boxes',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      name: 'Point of Sale', 
      href: '/pos', 
      icon: 'fas fa-cash-register',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: 'fas fa-chart-line',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      name: 'Returns & Refunds', 
      href: '/returns', 
      icon: 'fas fa-undo-alt',
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    { 
      name: 'Alerts', 
      href: '/alerts', 
      icon: 'fas fa-bell',
      badge: totalAlerts > 0 ? totalAlerts : undefined,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    { 
      name: 'Operators', 
      href: '/operators', 
      icon: 'fas fa-users-cog',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50'
    },
    { 
      name: 'Subscription', 
      href: '/subscription', 
      icon: 'fas fa-crown',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: 'fas fa-cog',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50'
    }
  ];

  const adminNavigation = [
    { 
      name: 'Admin Dashboard', 
      href: '/admin/dashboard', 
      icon: 'fas fa-chart-pie',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50'
    },
    { 
      name: 'Manage Feedback', 
      href: '/admin/feedback', 
      icon: 'fas fa-comments',
      color: 'text-teal-500',
      bgColor: 'bg-teal-50'
    },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          data-testid="overlay-sidebar"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        data-testid="sidebar-nav"
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-card border-r border-border h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Close button for mobile */}
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            data-testid="button-close-sidebar"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <i className="fas fa-times text-xl"></i>
          </Button>
        </div>

        {/* Logo with Monogram */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-base tracking-tighter">MSM</span>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg">MSM</h1>
            <p className="text-xs text-muted-foreground">Multipurpose Store Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {/* Main Navigation */}
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <button
                onClick={(e) => {
                  onClose();
                }}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground font-medium shadow-md'
                    : 'hover:bg-muted text-foreground hover:translate-x-1'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  isActive(item.href) 
                    ? 'bg-primary-foreground/20' 
                    : `${item.bgColor} group-hover:scale-110`
                }`}>
                  <i className={`${item.icon} ${isActive(item.href) ? 'text-primary-foreground' : item.color}`}></i>
                </div>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isActive(item.href) && (
                  <i className="fas fa-chevron-right text-xs"></i>
                )}
              </button>
            </Link>
          ))}

          {/* Admin Navigation - Only visible for admin users */}
          {user?.isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="px-4 py-2 flex items-center gap-2">
                  <i className="fas fa-shield-alt text-red-500"></i>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin Controls
                  </p>
                </div>
              </div>
              {adminNavigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <button
                    onClick={(e) => {
                      onClose();
                    }}
                    data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground font-medium shadow-md'
                        : 'hover:bg-muted text-foreground hover:translate-x-1'
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      isActive(item.href) 
                        ? 'bg-primary-foreground/20' 
                        : `${item.bgColor} group-hover:scale-110`
                    }`}>
                      <i className={`${item.icon} ${isActive(item.href) ? 'text-primary-foreground' : item.color}`}></i>
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive(item.href) && (
                      <i className="fas fa-chevron-right text-xs"></i>
                    )}
                  </button>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-gradient-to-t from-muted/30 to-transparent backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                {user ? getInitials(user.ownerName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate flex items-center gap-1">
                {user?.ownerName || 'User'}
                {user?.isAdmin && (
                  <i className="fas fa-crown text-amber-500 text-xs" title="Admin"></i>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logout();
              onClose();
            }}
            variant="outline"
            size="sm"
            className="w-full hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
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
    },
    { 
      name: 'Manage Feedback', 
      href: '/admin/feedback', 
      icon: 'fas fa-comments',
      color: 'text-teal-500',
      bgColor: 'bg-teal-50'
    },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          data-testid="overlay-sidebar"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        data-testid="sidebar-nav"
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 w-64 bg-card border-r border-border h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Close button for mobile */}
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            data-testid="button-close-sidebar"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <i className="fas fa-times text-xl"></i>
          </Button>
        </div>

        {/* Logo with Monogram */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-base tracking-tighter">MSM</span>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg">MSM</h1>
            <p className="text-xs text-muted-foreground">Multipurpose Store Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {/* Main Navigation */}
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <button
                onClick={(e) => {
                  onClose();
                }}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground font-medium shadow-md'
                    : 'hover:bg-muted text-foreground hover:translate-x-1'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  isActive(item.href) 
                    ? 'bg-primary-foreground/20' 
                    : `${item.bgColor} group-hover:scale-110`
                }`}>
                  <i className={`${item.icon} ${isActive(item.href) ? 'text-primary-foreground' : item.color}`}></i>
                </div>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isActive(item.href) && (
                  <i className="fas fa-chevron-right text-xs"></i>
                )}
              </button>
            </Link>
          ))}

          {/* Admin Navigation - Only visible for admin users */}
          {user?.isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="px-4 py-2 flex items-center gap-2">
                  <i className="fas fa-shield-alt text-red-500"></i>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin Controls
                  </p>
                </div>
              </div>
              {adminNavigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <button
                    onClick={(e) => {
                      onClose();
                    }}
                    data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground font-medium shadow-md'
                        : 'hover:bg-muted text-foreground hover:translate-x-1'
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      isActive(item.href) 
                        ? 'bg-primary-foreground/20' 
                        : `${item.bgColor} group-hover:scale-110`
                    }`}>
                      <i className={`${item.icon} ${isActive(item.href) ? 'text-primary-foreground' : item.color}`}></i>
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive(item.href) && (
                      <i className="fas fa-chevron-right text-xs"></i>
                    )}
                  </button>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-gradient-to-t from-muted/30 to-transparent backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                {user ? getInitials(user.ownerName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate flex items-center gap-1">
                {user?.ownerName || 'User'}
                {user?.isAdmin && (
                  <i className="fas fa-crown text-amber-500 text-xs" title="Admin"></i>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logout();
              onClose();
            }}
            variant="outline"
            size="sm"
            className="w-full hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
            data-testid="button-logout-sidebar"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}      {/* Navigation */}
      <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {/* Main Navigation */}
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <button
              onClick={(e) => {
                onClose();
              }}
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

        {/* Admin Navigation - Only visible for admin users */}
        {user?.isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Controls
                </p>
              </div>
            </div>
            {adminNavigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <button
                  onClick={(e) => {
                    onClose();
                  }}
                  data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.name}</span>
                </button>
              </Link>
            ))}
          </>
        )}
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
