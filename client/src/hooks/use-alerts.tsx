import { useMemo } from 'react';
import { useInventoryStore } from '@/store/inventory-store';
import { AlertItem } from '@/types';

export function useAlerts() {
  const { products } = useInventoryStore();

  const alerts = useMemo(() => {
    const alertItems: AlertItem[] = [];

    // Low stock alerts
    products.forEach(product => {
      if (product.quantity <= (product.lowStockThreshold || 0)) {
        alertItems.push({
          id: `low-stock-${product.id}`,
          type: 'low-stock',
          product,
          message: `${product.name} is running low (${product.quantity} left)`,
          priority: product.quantity === 0 ? 'high' : 'medium'
        });
      }
    });

    // Expiry alerts
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 30); // 30 days ahead

    products.forEach(product => {
      if (product.expiry) {
        const expiryDate = new Date(product.expiry);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          let priority: 'high' | 'medium' | 'low' = 'low';
          if (daysUntilExpiry <= 7) priority = 'high';
          else if (daysUntilExpiry <= 15) priority = 'medium';

          alertItems.push({
            id: `expiry-${product.id}`,
            type: 'expiry',
            product,
            message: `${product.name} expires in ${daysUntilExpiry} days`,
            priority
          });
        }
      }
    });

    return alertItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [products]);

  const lowStockAlerts = alerts.filter(alert => alert.type === 'low-stock');
  const expiryAlerts = alerts.filter(alert => alert.type === 'expiry');
  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');

  return {
    alerts,
    lowStockAlerts,
    expiryAlerts,
    highPriorityAlerts,
    totalAlerts: alerts.length
  };
}
