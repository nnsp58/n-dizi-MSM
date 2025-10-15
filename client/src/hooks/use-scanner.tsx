import { useState, useCallback, useRef, useEffect } from 'react';
import { scanner } from '@/lib/scanner';
import { ScanResult } from '@/types';
import { PWAUtils } from '@/lib/pwa-utils';

export function useScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) {
      setError('Video element not available');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      await scanner.startCamera(videoRef.current);

      scanner.startScanning((result) => {
        // Add to scan history
        setScanHistory(prev => {
          const exists = prev.find(item => item.code === result.code);
          if (!exists) {
            return [...prev, result];
          }
          return prev;
        });

        setScanResult(result);
        PWAUtils.showToast(`${result.format} scanned: ${result.code.substring(0, 10)}...`, 'success');
        
        // Vibrate on successful scan (if supported)
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    scanner.stopScanning();
    setIsScanning(false);
  }, []);

  const pauseScanning = useCallback(() => {
    scanner.pauseScanning();
  }, []);

  const resumeScanning = useCallback(() => {
    scanner.resumeScanning();
  }, []);

  const processBarcodeInput = useCallback((input: string): ScanResult | null => {
    const result = scanner.scanBarcode(input);
    if (result) {
      setScanResult(result);
      setScanHistory(prev => {
        const exists = prev.find(item => item.code === result.code);
        if (!exists) {
          return [...prev, result];
        }
        return prev;
      });
      PWAUtils.showToast(`Barcode processed: ${result.code}`, 'success');
    } else {
      setError('Invalid barcode format');
    }
    return result;
  }, []);

  const clearScanHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  const reset = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scanner.stopScanning();
    };
  }, []);

  return {
    isScanning,
    scanResult,
    scanHistory,
    error,
    videoRef,
    startScanning,
    stopScanning,
    pauseScanning,
    resumeScanning,
    processBarcodeInput,
    clearScanHistory,
    reset,
  };
}