interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAUtils {
  private static deferredPrompt: BeforeInstallPromptEvent | null = null;

  static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showToast('New version available! Refresh to update.', 'info');
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  static setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      console.log('Install prompt deferred');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.showToast('App installed successfully!', 'success');
    });
  }

  static async shareApp(data?: ShareData): Promise<void> {
    const defaultData: ShareData = {
      title: 'n-dizi Store Manager',
      text: 'Manage your shop with ease using n-dizi Store Manager - Complete offline-first PWA solution!',
      url: window.location.href
    };

    const shareData = { ...defaultData, ...data };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing or error occurred
        this.fallbackShare(shareData.url || window.location.href);
      }
    } else {
      this.fallbackShare(shareData.url || window.location.href);
    }
  }

  private static async fallbackShare(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      // Create a temporary input element for manual copy
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showToast('Link copied to clipboard!', 'success');
    }
  }

  static showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 translate-x-full`;
    
    const bgColor = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white'
    }[type];
    
    toast.className += ` ${bgColor}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  static openMailto(to: string, subject: string, body: string): void {
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  static checkSubscriptionExpiry(): { isExpiring: boolean; daysLeft: number } {
    // For free plan, no expiry
    return { isExpiring: false, daysLeft: -1 };
  }

  static async installPWA(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`Install prompt ${outcome}`);
      this.deferredPrompt = null;
    } else {
      this.showToast('Add to home screen from your browser menu', 'info');
    }
  }

  static canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  static formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  static formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
