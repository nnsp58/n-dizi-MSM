import * as XLSX from 'xlsx';
import { Product, Transaction } from '@/types';

export class ExcelExporter {
  exportInventory(products: Product[], filename?: string): void {
    const data = products.map(product => ({
      'Product Code': product.code,
      'Product Name': product.name,
      'Category': product.category || '',
      'Quantity': product.quantity,
      'Price (₹)': product.price,
      'GST (%)': product.gst,
      'Low Stock Threshold': product.lowStockThreshold || 0,
      'Expiry Date': product.expiry || '',
      'Description': product.description || ''
    }));

    this.exportToExcel(data, filename || `inventory_${this.getDateString()}.xlsx`);
  }

  exportTransactions(transactions: Transaction[], filename?: string): void {
    const data = transactions.map(transaction => ({
      'Invoice Number': transaction.invoiceNumber,
      'Date': new Date(transaction.createdAt).toLocaleDateString(),
      'Time': new Date(transaction.createdAt).toLocaleTimeString(),
      'Items Count': transaction.items.length,
      'Subtotal (₹)': transaction.subtotal,
      'GST (₹)': transaction.gst,
      'Total (₹)': transaction.total
    }));

    this.exportToExcel(data, filename || `transactions_${this.getDateString()}.xlsx`);
  }

  exportLowStockReport(products: Product[], filename?: string): void {
    const lowStockItems = products.filter(p => 
      p.quantity <= (p.lowStockThreshold || 0)
    );

    const data = lowStockItems.map(product => ({
      'Product Code': product.code,
      'Product Name': product.name,
      'Current Stock': product.quantity,
      'Threshold': product.lowStockThreshold || 0,
      'Shortage': Math.max(0, (product.lowStockThreshold || 0) - product.quantity),
      'Price (₹)': product.price,
      'Category': product.category || ''
    }));

    this.exportToExcel(data, filename || `low_stock_${this.getDateString()}.xlsx`);
  }

  exportSalesReport(transactions: Transaction[], startDate?: Date, endDate?: Date): void {
    let filteredTransactions = transactions;
    
    if (startDate || endDate) {
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        if (startDate && transactionDate < startDate) return false;
        if (endDate && transactionDate > endDate) return false;
        return true;
      });
    }

    // Summary data
    const summary = {
      'Total Sales (₹)': filteredTransactions.reduce((sum, t) => sum + t.total, 0),
      'Total Transactions': filteredTransactions.length,
      'Average Bill (₹)': filteredTransactions.length > 0 
        ? filteredTransactions.reduce((sum, t) => sum + t.total, 0) / filteredTransactions.length 
        : 0,
      'Total Items Sold': filteredTransactions.reduce((sum, t) => 
        sum + t.items.reduce((itemSum, item) => itemSum + item.cartQuantity, 0), 0
      )
    };

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = Object.entries(summary).map(([key, value]) => ({
      Metric: key,
      Value: typeof value === 'number' ? value.toFixed(2) : value
    }));
    const summaryWS = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // Transactions sheet
    const transactionData = filteredTransactions.map(t => ({
      'Invoice Number': t.invoiceNumber,
      'Date': new Date(t.createdAt).toLocaleDateString(),
      'Time': new Date(t.createdAt).toLocaleTimeString(),
      'Items Count': t.items.length,
      'Subtotal (₹)': t.subtotal,
      'GST (₹)': t.gst,
      'Total (₹)': t.total
    }));
    const transactionWS = XLSX.utils.json_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(wb, transactionWS, 'Transactions');
    
    // Item-wise sales
    const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        const key = item.code;
        const existing = itemSales.get(key) || { name: item.name, quantity: 0, revenue: 0 };
        existing.quantity += item.cartQuantity;
        existing.revenue += item.price * item.cartQuantity;
        itemSales.set(key, existing);
      });
    });
    
    const itemData = Array.from(itemSales.entries()).map(([code, data]) => ({
      'Product Code': code,
      'Product Name': data.name,
      'Total Quantity Sold': data.quantity,
      'Total Revenue (₹)': data.revenue.toFixed(2)
    }));
    
    const itemWS = XLSX.utils.json_to_sheet(itemData);
    XLSX.utils.book_append_sheet(wb, itemWS, 'Item Sales');
    
    // Save file
    const dateRange = startDate && endDate 
      ? `${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`
      : this.getDateString();
    
    XLSX.writeFile(wb, `sales_report_${dateRange}.xlsx`);
  }

  private exportToExcel(data: any[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  exportToCSV(data: any[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export const excelExporter = new ExcelExporter();
