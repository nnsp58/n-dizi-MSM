import jsPDF from 'jspdf';
import { InvoiceData } from '@/types';

export class PDFGenerator {
  generateInvoice(invoiceData: InvoiceData, isFreePlan: boolean = true): jsPDF {
    const doc = new jsPDF();
    
    // Add watermark for free plan
    if (isFreePlan) {
      this.addWatermark(doc, invoiceData.storeName);
    }
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.storeName, 105, 20, { align: 'center' });
    
    if (invoiceData.storeAddress) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.storeAddress, 105, 28, { align: 'center' });
    }
    
    if (invoiceData.storeContact) {
      doc.text(invoiceData.storeContact, 105, 34, { align: 'center' });
    }
    
    // Invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice: ${invoiceData.invoiceNumber}`, 20, 50);
    doc.text(`Date: ${invoiceData.date}`, 20, 58);
    doc.text(`Time: ${invoiceData.time}`, 20, 66);
    
    // Items table header
    const tableStart = 80;
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 20, tableStart);
    doc.text('Qty', 100, tableStart);
    doc.text('Price', 125, tableStart);
    doc.text('GST', 150, tableStart);
    doc.text('Total', 175, tableStart);
    
    // Draw header line
    doc.line(20, tableStart + 2, 190, tableStart + 2);
    
    // Items
    let y = tableStart + 10;
    doc.setFont('helvetica', 'normal');
    
    invoiceData.items.forEach(item => {
      const itemTotal = item.price * item.cartQuantity;
      const gstAmount = (itemTotal * item.gst) / 100;
      const lineTotal = itemTotal + gstAmount;
      
      // Handle long item names
      const itemName = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
      
      doc.text(itemName, 20, y);
      doc.text(String(item.cartQuantity), 100, y);
      doc.text(`₹${item.price.toFixed(2)}`, 125, y);
      doc.text(`${item.gst}%`, 150, y);
      doc.text(`₹${lineTotal.toFixed(2)}`, 175, y);
      
      y += 8;
    });
    
    // Summary
    y += 10;
    doc.line(120, y - 5, 190, y - 5);
    
    doc.text('Subtotal:', 120, y);
    doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, 175, y);
    
    y += 8;
    doc.text('GST:', 120, y);
    doc.text(`₹${invoiceData.gst.toFixed(2)}`, 175, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 120, y);
    doc.text(`₹${invoiceData.total.toFixed(2)}`, 175, y);
    
    // Footer
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, y, { align: 'center' });
    
    y += 10;
    doc.text('Presented by n-dizi', 105, y, { align: 'center' });
    
    return doc;
  }
  
  private addWatermark(doc: jsPDF, storeName: string): void {
    doc.setFontSize(50);
    doc.setTextColor(230, 230, 230);
    doc.setFont('helvetica', 'bold');
    
    // Rotate and add watermark
    doc.text(storeName, 105, 150, { 
      align: 'center', 
      angle: 45 
    });
    
    // Reset color
    doc.setTextColor(0, 0, 0);
  }
  
  downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(filename);
  }
  
  getPDFBlob(doc: jsPDF): Blob {
    return doc.output('blob');
  }
}

export const pdfGenerator = new PDFGenerator();
