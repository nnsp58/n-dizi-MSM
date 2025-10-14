import { useState, useCallback, useRef } from 'react';
import { scanner } from '@/lib/scanner';
import { ScanResult } from '@/types';
import { PWAUtils } from '@/lib/pwa-utils';

export function useScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) {
      setError('Video element not available');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);

      await scanner.startCamera(videoRef.current);

      scanner.startScanning((result) => {
        setScanResult(result);
        setIsScanning(false);
        PWAUtils.showToast('Code scanned successfully!', 'success');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    scanner.stopScanning();
    setIsScanning(false);
    setScanResult(null);
    setError(null);
  }, []);

  const processBarcodeInput = useCallback((input: string): ScanResult | null => {
    const result = scanner.scanBarcode(input);
    if (result) {
      setScanResult(result);
      PWAUtils.showToast('Barcode processed successfully!', 'success');
    } else {
      setError('Invalid barcode format');
    }
    return result;
  }, []);

  const reset = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  return {
    isScanning,
    scanResult,
    error,
    videoRef,
    startScanning,
    stopScanning,
    processBarcodeInput,
    reset,
  };
}