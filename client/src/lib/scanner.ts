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
  private scanInterval = 500;

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.video = videoElement;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      this.video.srcObject = this.stream;
      await this.video.play();

      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
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
    this.scanFrame();
  }

  private scanFrame(): void {
    if (!this.scanning || !this.video || !this.canvas || !this.context) {
      return;
    }

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.height = this.video.videoHeight;
      this.canvas.width = this.video.videoWidth;

      this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

      const now = Date.now();
      if (now - this.lastScanTime > this.scanInterval) {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        this.lastScanTime = now;

        if (code && this.onScanCallback) {
          this.onScanCallback({
            code: code.data,
            format: 'QR',
          });
          this.stopScanning();
          return;
        }
      }
    }

    requestAnimationFrame(() => this.scanFrame());
  }

  stopScanning(): void {
    this.scanning = false;

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }
  }

  scanBarcode(input: string): ScanResult | null {
    if (/^[0-9]{8,13}$/.test(input)) {
      return {
        code: input,
        format: 'EAN/UPC',
      };
    }
    return null;
  }
}

export const scanner = new ScannerManager();
