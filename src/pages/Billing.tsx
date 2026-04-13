import { useState } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function Billing() {
  const { billings, transactions, vehicles, packages, services, loading, refreshBillings } = useData();
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handlePayment = async () => {
    if (!selectedBill) return;
    try {
      await api.put('/billing', {
        BillingId: selectedBill.BillingId,
        BalancePaid: selectedBill.TransactionBalance, // Assume full payment for simplicity
        BillingStatus: 'Paid'
      });
      setIsPayDialogOpen(false);
      refreshBillings();
    } catch (error) {
      console.error('Failed to process payment', error);
    }
  };

  const openPayDialog = (bill: any) => {
    setSelectedBill(bill);
    setIsPayDialogOpen(true);
  };

  const openReceiptDialog = (bill: any) => {
    setSelectedBill(bill);
    setIsReceiptDialogOpen(true);
  };

  const openViewDialog = (bill: any) => {
    setSelectedBill(bill);
    setIsViewDialogOpen(true);
  };

  const filteredBillings = billings.filter(b => {
    const trans = transactions.find(t => t.TransactionId === b.BillingId);
    const vehicle = trans ? vehicles.find(v => v.VehicleId === trans.VehicleId) : null;
    const plate = vehicle ? vehicle.PlateNumber.toLowerCase() : '';
    const id = b.BillingId.toLowerCase();
    const status = b.BillingStatus.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesQuery = plate.includes(query) || id.includes(query) || status.includes(query);
    const matchesDate = !date || (b.DateCreated && isSameDay(new Date(b.DateCreated), date));
    
    return matchesQuery && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Billing & Payments</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal bg-background text-foreground border-border",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>All Dates</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border-border" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="bg-background text-foreground"
              />
              <div className="p-2 border-t border-border">
                <Button variant="ghost" className="w-full text-xs" onClick={() => setDate(undefined)}>Clear Filter</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search billing records..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBillings.map((b) => {
                const trans = transactions.find(t => t.TransactionId === b.BillingId);
                const vehicle = trans ? vehicles.find(v => v.VehicleId === trans.VehicleId) : null;
                return (
                  <TableRow key={b.BillingId}>
                    <TableCell className="font-medium text-xs">{b.BillingId.substring(0, 8)}...</TableCell>
                    <TableCell>{b.DateCreated ? format(new Date(b.DateCreated), 'MMM d, yyyy') : 'N/A'}</TableCell>
                    <TableCell>{vehicle ? vehicle.PlateNumber : 'Unknown'}</TableCell>
                    <TableCell className="font-bold">₱{b.TransactionBalance?.toLocaleString()}</TableCell>
                    <TableCell>{b.TransactionDiscount}%</TableCell>
                    <TableCell>
                      <Badge variant={b.BillingStatus === 'Paid' ? 'default' : 'destructive'}>
                        {b.BillingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" onClick={() => openViewDialog(b)}>View</Button>
                      {b.BillingStatus === 'Unpaid' && trans?.TransactionStatus === 'Completed' && (
                        <Button onClick={() => openPayDialog(b)}>Pay Now</Button>
                      )}
                      {b.BillingStatus === 'Paid' && (
                        <Button variant="outline" size="sm" onClick={() => openReceiptDialog(b)}>Receipt</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-lg text-foreground">₱{selectedBill.TransactionBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount Applied:</span>
                  <span className="text-foreground">{selectedBill.TransactionDiscount}%</span>
                </div>
              </div>
              <Button onClick={handlePayment} className="w-full">Confirm Full Payment</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center">Official Receipt</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6 p-4 border rounded-md bg-card font-mono text-sm text-card-foreground">
              <div className="text-center border-b pb-4 border-border">
                <h2 className="font-bold text-xl text-foreground">LUXOWASH</h2>
                <p className="text-muted-foreground">Carwash & Detailing Services</p>
                <p className="text-muted-foreground mt-2">Receipt #: {selectedBill.BillingId.substring(0, 8).toUpperCase()}</p>
                <p className="text-muted-foreground">Date: {format(new Date(selectedBill.DateUpdated || selectedBill.DateCreated), 'MMM d, yyyy h:mm a')}</p>
              </div>
              
              <div className="space-y-2 py-4 border-b border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₱{(selectedBill.TransactionBalance / (1 - (selectedBill.TransactionDiscount/100))).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Discount ({selectedBill.TransactionDiscount}%)</span>
                  <span>-₱{((selectedBill.TransactionBalance / (1 - (selectedBill.TransactionDiscount/100))) * (selectedBill.TransactionDiscount/100)).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-lg pt-2 text-foreground">
                <span>TOTAL PAID</span>
                <span>₱{selectedBill.BalancePaid.toLocaleString()}</span>
              </div>
              
              <div className="text-center pt-8 text-muted-foreground text-xs">
                <p>Thank you for choosing Luxowash!</p>
                <p>Please come again.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Billing & Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Billing ID</p>
                  <p className="font-medium text-foreground">{selectedBill.BillingId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{selectedBill.DateCreated ? format(new Date(selectedBill.DateCreated), 'MMM d, yyyy h:mm a') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium text-foreground">
                    {(() => {
                      const trans = transactions.find(t => t.TransactionId === selectedBill.BillingId);
                      const vehicle = trans ? vehicles.find(v => v.VehicleId === trans.VehicleId) : null;
                      return vehicle ? vehicle.PlateNumber : 'Unknown';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedBill.BillingStatus === 'Paid' ? 'default' : 'destructive'}>
                    {selectedBill.BillingStatus}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Discount</p>
                  <p className="font-medium text-foreground">{selectedBill.TransactionDiscount || 0}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold text-primary">₱{selectedBill.TransactionBalance?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
