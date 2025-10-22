// File Location: client/src/pages/dashboard.tsx
// Replace this entire file with the code below

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/auth-store';
import { useAlerts } from '@/hooks/use-alerts';
import { useEffect, useState } from 'react';

// Define a simple fallback for useAlerts if it causes an issue
// NOTE: Assuming useAlerts returns { totalAlerts: number }
const useAlertsSafe = () => {
  try {
    return useAlerts();
  } catch (error) {
    console.error("Failed to load useAlerts hook, using fallback.", error);
    return { totalAlerts: 0 };
  }
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  // Safe access to user (user might be null if state persistence failed)
  const { user, isAuthenticated } = useAuthStore(state => ({ user: state.user, isAuthenticated: state.isAuthenticated }));
  const { totalAlerts } = useAlertsSafe(); // Using safe hook

  // Redirect if not authenticated (basic security check for the component)
  useEffect(() => {
      if (isAuthenticated === false) {
          setLocation('/auth');
      }
  }, [isAuthenticated, setLocation]);

  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Load stats from your data store
    // This is a placeholder - replace with actual data fetching
    setStats({
      totalProducts: 150,
      lowStockItems: 12,
      todaySales: 45,
      totalRevenue: 125000
    });
  }, []);

  const quickActions = [
    {
      title: 'New Sale',
      description: 'Start a new transaction',
      icon: 'fa-cash-register',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      href: '/pos',
      testId: 'quick-action-new-sale'
    },
    {
      title: 'Add Product',
      description: 'Add item to inventory',
      icon: 'fa-box',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      href: '/inventory',
      testId: 'quick-action-add-product'
    },
    {
      title: 'View Reports',
      description: 'Check sales analytics',
      icon: 'fa-chart-bar',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      href: '/reports',
      testId: 'quick-action-reports'
    },
    {
      title: 'Manage Stock',
      description: 'Update inventory levels',
      icon: 'fa-boxes',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      href: '/inventory',
      testId: 'quick-action-manage-stock'
    },
    {
      title: 'Returns',
      description: 'Process returns & refunds',
      icon: 'fa-undo-alt',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      href: '/returns',
      testId: 'quick-action-returns'
    },
    {
      title: 'Settings',
      description: 'Configure your store',
      icon: 'fa-cog',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      href: '/settings',
      testId: 'quick-action-settings'
    }
  ];

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: 'fa-cubes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Items in inventory'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: 'fa-exclamation-triangle',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Need reordering',
      alert: stats.lowStockItems > 0
    },
    {
      title: "Today's Sales",
      value: stats.todaySales,
      icon: 'fa-shopping-cart',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Transactions completed'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: 'fa-rupee-sign',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: "Today's earnings"
    }
  ];

  // Optional: Add a loading check, though if the screen is white, this won't help
  if (user === null && isAuthenticated === null) {
      return <div className="p-6 text-center text-muted-foreground">Loading authentication status...</div>;
  }

  // Final render
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <i className="fas fa-user-circle text-4xl"></i>
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.ownerName || 'User'}!</h2>
            <p className="text-primary-foreground/90">Here's what's happening in your store today</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <i className={`fas ${stat.icon} ${stat.color} text-xl`}></i>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground flex items-center gap-2">
                {stat.value}
                {stat.alert && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                    Alert
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-bolt text-yellow-500"></i>
            Quick Actions
          </CardTitle>
          <CardDescription>Commonly used features for faster workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={() => setLocation(action.href)}
                data-testid={action.testId}
                className={`${action.color} ${action.hoverColor} text-white h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all transform hover:scale-105 hover:shadow-lg`}
              >
                <i className={`fas ${action.icon} text-3xl`}></i>
                <div className="text-center">
                  <div className="font-semibold text-lg">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {totalAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <i className="fas fa-bell animate-pulse"></i>
              Active Alerts ({totalAlerts})
            </CardTitle>
            <CardDescription>You have important notifications that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation('/alerts')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <i className="fas fa-eye mr-2"></i>
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-history text-blue-500"></i>
            Recent Activity
          </CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <i className="fas fa-inbox text-4xl mb-3"></i>
            <p>Recent activity will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
