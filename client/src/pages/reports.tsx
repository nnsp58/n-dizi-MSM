import { useState, useMemo } from 'react';
import { useTransactionStore } from '@/store/transaction-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PWAUtils } from '@/lib/pwa-utils';
import { excelExporter } from '@/lib/excel-export';

export default function Reports() {
  const { transactions, getTransactionsByDateRange, getReportStats } = useTransactionStore();
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { filteredTransactions, reportStats } = useMemo(() => {
    let filtered = transactions;
    let startDateObj: Date | undefined;
    let endDateObj: Date | undefined;

    // Apply period filter
    const now = new Date();
    switch (selectedPeriod) {
      case 'Today':
        startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'Yesterday':
        startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'Last 7 Days':
        startDateObj = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDateObj = now;
        break;
      case 'Last 30 Days':
        startDateObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDateObj = now;
        break;
      case 'This Month':
        startDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
        endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'Last Month':
        startDateObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Custom Range':
        if (startDate && endDate) {
          startDateObj = new Date(startDate);
          endDateObj = new Date(endDate);
          endDateObj.setDate(endDateObj.getDate() + 1); // Include end date
        }
        break;
    }

    if (startDateObj && endDateObj) {
      filtered = getTransactionsByDateRange(startDateObj, endDateObj);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    const stats = getReportStats(startDateObj, endDateObj);

    return { filteredTransactions: filtered, reportStats: stats };
  }, [transactions, selectedPeriod, startDate, endDate, searchQuery, getTransactionsByDateRange, getReportStats]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleExportExcel = () => {
    let exportStartDate: Date | undefined;
    let exportEndDate: Date | undefined;

    if (selectedPeriod === 'Custom Range' && startDate && endDate) {
      exportStartDate = new Date(startDate);
      exportEndDate = new Date(endDate);
    }

    excelExporter.exportSalesReport(filteredTransactions, exportStartDate, exportEndDate);
  };

  const handleExportCSV = () => {
    const data = filteredTransactions.map(t => ({
      'Invoice Number': t.invoiceNumber,
      'Date': new Date(t.createdAt).toLocaleDateString(),
      'Time': new Date(t.createdAt).toLocaleTimeString(),
      'Items Count': t.items.length,
      'Subtotal': t.subtotal,
      'GST': t.gst,
      'Total': t.total
    }));

    excelExporter.exportToCSV(data, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sales Reports</h1>
          <p className="text-muted-foreground">View and export your sales data</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportExcel}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <i className="fas fa-file-excel"></i>
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <i className="fas fa-file-csv"></i>
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">Period:</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="Yesterday">Yesterday</SelectItem>
                  <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="Last Month">Last Month</SelectItem>
                  <SelectItem value="Custom Range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriod === 'Custom Range' && (
              <div className="flex-1 flex gap-3">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-primary text-xl"></i>
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold text-foreground">
              {PWAUtils.formatCurrency(reportStats.totalSales)}
            </p>
            <p className="text-xs text-green-600 mt-2">
              <i className="fas fa-arrow-up"></i> Period total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-receipt text-secondary text-xl"></i>
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Transactions</h3>
            <p className="text-2xl font-bold text-foreground">{reportStats.totalTransactions}</p>
            <p className="text-xs text-green-600 mt-2">
              <i className="fas fa-arrow-up"></i> Period total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-amber-600 text-xl"></i>
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Average Order</h3>
            <p className="text-2xl font-bold text-foreground">
              {PWAUtils.formatCurrency(reportStats.averageBill)}
            </p>
            <p className="text-xs text-green-600 mt-2">
              <i className="fas fa-arrow-up"></i> Period average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-box text-green-600 text-xl"></i>
              </div>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">Items Sold</h3>
            <p className="text-2xl font-bold text-foreground">
              {filteredTransactions.reduce((sum, t) => 
                sum + t.items.reduce((itemSum, item) => itemSum + item.cartQuantity, 0), 0
              )}
            </p>
            <p className="text-xs text-green-600 mt-2">
              <i className="fas fa-arrow-up"></i> Period total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {currentTransactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No.</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <code className="font-mono font-semibold text-primary">
                            #{transaction.invoiceNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {PWAUtils.formatDate(transaction.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{transaction.items.length} items</span>
                        </TableCell>
                        <TableCell>
                          {PWAUtils.formatCurrency(transaction.gst)}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-foreground">
                            {PWAUtils.formatCurrency(transaction.total)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Open invoice preview or download
                              PWAUtils.showToast('Invoice download feature coming soon', 'info');
                            }}
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + Math.max(1, currentPage - 2);
                      if (pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'No transactions in the selected period'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
