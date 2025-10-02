import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScanner } from '@/hooks/use-scanner';

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanType: 'qr' | 'barcode';
  onScanComplete: (result: { code: string; format: string }) => void;
}

export default function ScannerModal({ 
  open, 
  onOpenChange, 
  scanType, 
  onScanComplete 
}: ScannerModalProps) {
  const {
    isScanning,
    scanResult,
    error,
    videoRef,
    startScanning,
    stopScanning,
    processBarcodeInput,
    reset
  } = useScanner();
  
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (scanResult) {
      onScanComplete(scanResult);
      handleClose();
    }
  }, [scanResult, onScanComplete]);

  useEffect(() => {
    if (open) {
      reset();
      setManualCode('');
    } else {
      stopScanning();
    }
  }, [open, reset, stopScanning]);

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    
    if (scanType === 'barcode') {
      const result = processBarcodeInput(manualCode);
      if (result) {
        onScanComplete(result);
        handleClose();
      }
    } else {
      // For QR codes, accept any input
      onScanComplete({ code: manualCode, format: 'Manual' });
      handleClose();
    }
  };

  const getScannerTitle = () => {
    return scanType === 'qr' ? 'Scan QR Code' : 'Scan Barcode';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {getScannerTitle()}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <i className="fas fa-times"></i>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative aspect-square bg-black/50 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center text-white">
                  <i className="fas fa-camera text-4xl mb-4"></i>
                  <p className="text-sm">Camera not active</p>
                </div>
              </div>
            )}
            
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-primary rounded-lg scanner-frame"></div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Camera Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                <i className="fas fa-camera mr-2"></i>
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="secondary" className="flex-1">
                <i className="fas fa-stop mr-2"></i>
                Stop Camera
              </Button>
            )}
          </div>

          <p className="text-center text-white/80 text-sm">
            Position the {scanType === 'qr' ? 'QR code' : 'barcode'} within the frame
          </p>

          {/* Manual Input */}
          <div className="relative border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Or enter code manually:</p>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={`Enter ${scanType === 'qr' ? 'QR code' : 'barcode'}...`}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                Submit
              </Button>
            </div>
          </div>

          <Button onClick={handleClose} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
