import jsQR from 'jsqr';
import { ScanResult } from '@/types';

export class ScannerManager {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private scanning = false;
  private onScanCallback: ((result: ScanResult) => void) | null = null;
  private lastScanTime = 0;
  private scanInterval = 100; // Reduced from 500 to 100ms for faster scanning
  private isProcessing = false;

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.video = videoElement;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 480 }, // Reduced from 640 for faster processing
          height: { ideal: 320 }, // Reduced from 480 for faster processing
        },
      });

      this.video.srcObject = this.stream;
      await this.video.play();

      // Pre-create canvas for better performance
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d', { alpha: false });
      
      // Set canvas size once video is ready
      this.video.addEventListener('loadedmetadata', () => {
        if (this.canvas && this.video) {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
        }
      });

    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Camera access denied or not available');
    }
  }

  startScanning(onScan: (result: ScanResult) => void): void {
    if (!this.video || !this.canvas || !this.context) {
      throw new Error('Camera not initialized');
    }

    this.onScanCallback = onScan;
    this.scanning = true;
    this.isProcessing = false;
    this.scanFrame();
  }

  private scanFrame(): void {
    if (!this.scanning || !this.video || !this.canvas || !this.context) {
      return;
    }

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA && !this.isProcessing) {
      const now = Date.now();
      
      if (now - this.lastScanTime > this.scanInterval) {
        this.isProcessing = true;
        this.lastScanTime = now;

        // Optimized canvas drawing
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;
        
        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;
        this.context.drawImage(this.video, 0, 0);

        // Crop to center area for faster processing (60% of frame)
        const cropWidth = Math.floor(videoWidth * 0.6);
        const cropHeight = Math.floor(videoHeight * 0.6);
        const offsetX = Math.floor((videoWidth - cropWidth) / 2);
        const offsetY = Math.floor((videoHeight - cropHeight) / 2);

        try {
          const imageData = this.context.getImageData(offsetX, offsetY, cropWidth, cropHeight);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert', // Skip inversion for speed
          });

          if (code && this.onScanCallback) {
            this.onScanCallback({
              code: code.data,
              format: 'QR',
            });
            // Don't stop scanning automatically - let user control it
            // this.stopScanning();
            this.isProcessing = false;
            return;
          }
        } catch (error) {
          console.warn('Scan frame error:', error);
        }
        
        this.isProcessing = false;
      }
    }

    requestAnimationFrame(() => this.scanFrame());
  }

  stopScanning(): void {
    this.scanning = false;
    this.isProcessing = false;

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // Enhanced barcode validation
  scanBarcode(input: string): ScanResult | null {
    // Remove spaces and validate
    const cleanInput = input.replace(/s+/g, '');
    
    // EAN-8, EAN-13, UPC-A, UPC-E patterns
    if (/^[0-9]{8}$/.test(cleanInput)) {
      return { code: cleanInput, format: 'EAN-8' };
    }
    if (/^[0-9]{12,13}$/.test(cleanInput)) {
      return { code: cleanInput, format: 'EAN-13/UPC-A' };
    }
    if (/^[0-9]{6,8}$/.test(cleanInput)) {
      return { code: cleanInput, format: 'UPC-E' };
    }
    
    // Generic numeric codes
    if (/^[0-9]{4,20}$/.test(cleanInput)) {
      return { code: cleanInput, format: 'Numeric Code' };
    }
    
    return null;
  }

  // Method to pause/resume scanning without stopping camera
  pauseScanning(): void {
    this.scanning = false;
    this.isProcessing = false;
  }

  resumeScanning(): void {
    if (this.video && this.canvas && this.context) {
      this.scanning = true;
      this.isProcessing = false;
      this.scanFrame();
    }
  }
}

export const scanner = new ScannerManager();