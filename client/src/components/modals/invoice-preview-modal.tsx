import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { pdfGenerator } from '@/lib/pdf-generator';
import { PWAUtils } from '@/lib/pwa-utils';
import { InvoiceData } from '@/types';

interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData | null;
}

export default function InvoicePreviewModal({ 
  open, 
  onOpenChange, 
  invoiceData 
}: InvoicePreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoiceData) return null;

  const handleDownloadPDF = () => {
    try {
      const doc = pdfGenerator.generateInvoice(invoiceData, true); // Free plan = watermark
      pdfGenerator.downloadPDF(doc, `${invoiceData.invoiceNumber}.pdf`);
      PWAUtils.showToast('Invoice downloaded successfully', 'success');
    } catch (error) {
      PWAUtils.showToast('Failed to download PDF', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const subtotalAmount = invoiceData.subtotal;
  const gstAmount = invoiceData.gst;
  const totalAmount = invoiceData.total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Invoice Preview</DialogTitle>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <i className="fas fa-print mr-2"></i>
              Print
            </Button>
            <Button onClick={handleDownloadPDF} size="sm">
              <i className="fas fa-download mr-2"></i>
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Invoice Content */}
        <div ref={printRef} className="p-8 bg-white text-black min-h-[600px] relative">
          {/* Watermark for Free Plan */}
          <div className="invoice-watermark absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-200 text-center whitespace-nowrap pointer-events-none">
            {invoiceData.storeName.toUpperCase()}
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {invoiceData.storeName}
              </h1>
              {invoiceData.storeAddress && (
                <p className="text-sm text-gray-600 mb-1">{invoiceData.storeAddress}</p>
              )}
              {invoiceData.storeContact && (
                <p className="text-sm text-gray-600">Phone: {invoiceData.storeContact}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 mb-1">
                {invoiceData.invoiceNumber}
              </p>
              <p className="text-sm text-gray-600">{invoiceData.date}</p>
              <p className="text-sm text-gray-600">{invoiceData.time}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                  <th className="py-3 text-center text-sm font-semibold text-gray-900">Qty</th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-900">GST %</th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => {
                  const itemTotal = item.price * item.cartQuantity;
                  const gst = (itemTotal * item.gst) / 100;
                  const lineTotal = itemTotal + gst;
                  
                  return (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.code}</p>
                        </div>
                      </td>
                      <td className="py-3 text-center text-sm text-gray-900">
                        {item.cartQuantity}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-900">
                        {PWAUtils.formatCurrency(item.price)}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-900">
                        {item.gst}%
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-gray-900">
                        {PWAUtils.formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="border-t border-gray-300 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {PWAUtils.formatCurrency(subtotalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST:</span>
                  <span className="font-medium text-gray-900">
                    {PWAUtils.formatCurrency(gstAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    {PWAUtils.formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Thank you for your business!</p>
            <p className="text-xs">Presented by n-dizi</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
