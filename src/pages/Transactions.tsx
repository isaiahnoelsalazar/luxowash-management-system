import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Transactions() {
  const { transactions, activeEmployees, employees: allEmployees, vehicles, services, packages, loading, refreshTransactions } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [extras, setExtras] = useState<string>('');
  const [truckPrice, setTruckPrice] = useState<number>(0);
  const [truckNotes, setTruckNotes] = useState<string>('');

  const getServicesInPackage = (pkgId: string) => {
    if (!pkgId || pkgId === 'none') return [];
    const pkg = packages.find(p => p.PackageId === pkgId);
    if (!pkg || !pkg.PackageDetails) return [];
    return pkg.PackageDetails.split(',').map((s: string) => s.trim());
  };

  const handlePackageChange = (pkgId: string) => {
    setSelectedPackage(pkgId);
    const includedServices = getServicesInPackage(pkgId);
    if (includedServices.length > 0) {
      setSelectedServices(prev => prev.filter(srv => !includedServices.includes(srv)));
    }
  };

  const calculateTotal = () => {
    let total = 0;
    const vehicleId = selectedVehicle ? selectedVehicle.split(':')[0] : '';
    const vehicle = vehicles.find(v => v.VehicleId === vehicleId);
    
    if (vehicle?.VehicleModel === 'TRUCK') {
      total = truckPrice;
    } else {
      const size = vehicle ? vehicle.VehicleSize : 'M';
      const sizeKey = `Size${size}`;

      // Add Package Price
      if (selectedPackage && selectedPackage !== 'none') {
        const pkg = packages.find(p => p.PackageId === selectedPackage);
        if (pkg) {
          total += pkg[`PackagePrice${sizeKey}`] || 0;
        }
      }

      // Add Services Price
      const includedServices = getServicesInPackage(selectedPackage);
      selectedServices.forEach(srvName => {
        if (!includedServices.includes(srvName)) {
          const srv = services.find(s => s.ServiceName === srvName);
          if (srv) {
            if (vehicle?.VehicleModel === 'MOTORCYCLE' && srv.ServiceId === 'S_RBWRM' && size === 'M') {
              total += srv.ServicePriceSizeL || 0;
            } else {
              total += srv[`ServicePrice${sizeKey}`] || 0;
            }
          }
        }
      });
    }

    // Apply Discount
    if (discount > 0) {
      total = total - (total * (discount / 100));
    }

    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0 || !selectedVehicle) {
      alert('Please select at least one employee and a vehicle.');
      return;
    }

    const totalBalance = calculateTotal();

    const vehicleId = selectedVehicle ? selectedVehicle.split(':')[0] : '';
    const isTruck = vehicles.find(v => v.VehicleId === vehicleId)?.VehicleModel === 'TRUCK';
    const finalExtras = isTruck ? (extras ? `${extras} | Notes: ${truckNotes}` : `Notes: ${truckNotes}`) : extras;

    const payload = {
      EmployeeIdList: selectedEmployees.join(','),
      ServiceIdList: isTruck ? '' : selectedServices.map(name => services.find(s => s.ServiceName === name)?.ServiceId).filter(Boolean).join(','),
      PackageId: isTruck ? '' : selectedPackage,
      Extras: finalExtras,
      VehicleId: vehicleId,
      TotalBalance: totalBalance,
      Discount: discount,
      TransactionStatus: 'Ready'
    };

    try {
      await api.post('/transactions', payload);
      setIsDialogOpen(false);
      resetForm();
      refreshTransactions();
    } catch (error) {
      console.error('Failed to create transaction', error);
    }
  };

  const resetForm = () => {
    setSelectedEmployees([]);
    setSelectedVehicle('');
    setSelectedServices([]);
    setSelectedPackage('');
    setDiscount(0);
    setExtras('');
    setTruckPrice(0);
    setTruckNotes('');
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put('/transactions', { TransactionId: id, TransactionStatus: status });
      refreshTransactions();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const openViewDialog = (transaction: any) => {
    setSelectedTransactionDetails(transaction);
    setIsViewDialogOpen(true);
  };

  const busyEmployeeIds = new Set<string>();
  transactions.forEach(t => {
    if (t.TransactionStatus === 'Ready' || t.TransactionStatus === 'In Progress') {
      if (t.EmployeeIdList) {
        t.EmployeeIdList.split(',').forEach((id: string) => busyEmployeeIds.add(id.trim()));
      }
    }
  });

  const availableEmployees = activeEmployees.filter(emp => !busyEmployeeIds.has(emp.EmployeeId));

  const busyVehicleIds = new Set<string>();
  transactions.forEach(t => {
    if (t.TransactionStatus === 'Ready' || t.TransactionStatus === 'In Progress') {
      busyVehicleIds.add(t.VehicleId);
    }
  });

  const availableVehicles = vehicles.filter(v => !busyVehicleIds.has(v.VehicleId));

  const filteredTransactions = transactions.filter(t => {
    const vehicle = vehicles.find(v => v.VehicleId === t.VehicleId);
    const plate = vehicle ? vehicle.PlateNumber.toLowerCase() : '';
    const id = t.TransactionId.toLowerCase();
    const status = t.TransactionStatus.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return plate.includes(query) || id.includes(query) || status.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>New Transaction</Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search transactions..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label>Select Vehicle (Available)</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle">
                      {selectedVehicle ? (() => {
                        const vId = selectedVehicle.split(':')[0];
                        const v = availableVehicles.find(v => v.VehicleId === vId);
                        return v ? `${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}` : undefined;
                      })() : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map(v => (
                      <SelectItem key={v.VehicleId} value={`${v.VehicleId}:${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}`}>
                        {v.PlateNumber} - {v.VehicleBrand} {v.VehicleModel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employees Selection */}
              <div className="space-y-2">
                <Label>Assign Employees (Timed In & Available)</Label>
                <div className="grid grid-cols-2 gap-2 border p-4 rounded-md">
                  {availableEmployees.length === 0 && <p className="text-sm text-gray-500">No available employees.</p>}
                  {availableEmployees.map(emp => (
                    <div key={emp.EmployeeId} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`emp-${emp.EmployeeId}`} 
                        checked={selectedEmployees.includes(emp.EmployeeId)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedEmployees([...selectedEmployees, emp.EmployeeId]);
                          else setSelectedEmployees(selectedEmployees.filter(id => id !== emp.EmployeeId));
                        }}
                      />
                      <label htmlFor={`emp-${emp.EmployeeId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {emp.FirstName} {emp.LastName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package Selection */}
              {vehicles.find(v => v.VehicleId === (selectedVehicle ? selectedVehicle.split(':')[0] : ''))?.VehicleBrand !== 'GENERAL VEHICLE' && (
                <div className="space-y-2">
                  <Label>Select Package (Optional)</Label>
                  <Select value={selectedPackage} onValueChange={handlePackageChange}>
                    <SelectTrigger><SelectValue placeholder="Select a package" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {packages.map(p => (
                        <SelectItem key={p.PackageId} value={p.PackageId}>
                          {p.PackageName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Services Selection */}
              {vehicles.find(v => v.VehicleId === (selectedVehicle ? selectedVehicle.split(':')[0] : ''))?.VehicleModel !== 'TRUCK' && (
                <div className="space-y-2">
                  <Label>Additional Services</Label>
                  <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                    {services.filter(srv => {
                      const vehicleId = selectedVehicle ? selectedVehicle.split(':')[0] : '';
                      const vehicle = vehicles.find(v => v.VehicleId === vehicleId);
                      if (!vehicle) return true;
                      
                      const model = vehicle.VehicleModel;
                      if (model === 'E-BIKE') return ['S_VCBWE', 'S_VCA', 'S_VCW'].includes(srv.ServiceId);
                      if (model === 'MOTORCYCLE') return ['S_RBWRM', 'S_VCBWM', 'S_VCA', 'S_VCW'].includes(srv.ServiceId);
                      if (model === 'TRICYCLE') return srv.ServiceId === 'S_VCBWT';
                      if (model === 'PUV (JEEP)') return srv.ServiceId === 'S_VCBWP';
                      
                      return true;
                    }).map(srv => {
                      const isIncluded = getServicesInPackage(selectedPackage).includes(srv.ServiceName);
                      return (
                        <div key={srv.ServiceName} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`srv-${srv.ServiceName}`} 
                            checked={isIncluded || selectedServices.includes(srv.ServiceName)}
                            disabled={isIncluded}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedServices([...selectedServices, srv.ServiceName]);
                              else setSelectedServices(selectedServices.filter(name => name !== srv.ServiceName));
                            }}
                          />
                          <label htmlFor={`srv-${srv.ServiceName}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {srv.ServiceName} {isIncluded && <span className="text-xs text-blue-500 ml-1">(Included)</span>}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Truck Specific Fields */}
              {vehicles.find(v => v.VehicleId === (selectedVehicle ? selectedVehicle.split(':')[0] : ''))?.VehicleModel === 'TRUCK' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Negotiated Price (₱)</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={truckPrice} 
                      onChange={e => setTruckPrice(Number(e.target.value))} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes / What to do</Label>
                    <Input 
                      value={truckNotes} 
                      onChange={e => setTruckNotes(e.target.value)} 
                      placeholder="Enter details..."
                      required
                    />
                  </div>
                </div>
              )}

              {/* Discount & Extras */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount (%) - Max 20%</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="20" 
                    value={discount} 
                    onChange={e => setDiscount(Number(e.target.value))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extras (e.g., Perfume)</Label>
                  <Input 
                    value={extras} 
                    onChange={e => setExtras(e.target.value)} 
                    placeholder="Enter extras..."
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-gray-700">Estimated Total:</span>
                <span className="text-2xl font-bold text-blue-600">₱{calculateTotal().toLocaleString()}</span>
              </div>

              <Button type="submit" className="w-full">Create Transaction</Button>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => {
                const vehicle = vehicles.find(v => v.VehicleId === t.VehicleId);
                return (
                  <TableRow key={t.TransactionId}>
                    <TableCell className="font-medium text-xs">{t.TransactionId.substring(0, 8)}...</TableCell>
                    <TableCell>{t.DateCreated ? format(new Date(t.DateCreated), 'MMM d, yyyy h:mm a') : 'N/A'}</TableCell>
                    <TableCell>{vehicle ? vehicle.PlateNumber : 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant={t.TransactionStatus === 'Completed' ? 'default' : t.TransactionStatus === 'Cancelled' ? 'destructive' : 'secondary'}>
                        {t.TransactionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openViewDialog(t)}>View</Button>
                      <Select value={t.TransactionStatus} onValueChange={(val) => updateStatus(t.TransactionId, val)}>
                        <SelectTrigger className="w-[140px] inline-flex h-8">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ready">Ready</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Transaction Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransactionDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium">{selectedTransactionDetails.TransactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{selectedTransactionDetails.DateCreated ? format(new Date(selectedTransactionDetails.DateCreated), 'MMM d, yyyy h:mm a') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium">
                    {vehicles.find(v => v.VehicleId === selectedTransactionDetails.VehicleId)?.PlateNumber || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={selectedTransactionDetails.TransactionStatus === 'Completed' ? 'default' : selectedTransactionDetails.TransactionStatus === 'Cancelled' ? 'destructive' : 'secondary'}>
                    {selectedTransactionDetails.TransactionStatus}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Assigned Employees</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTransactionDetails.EmployeeIdList?.split(',').map((id: string) => {
                    const emp = allEmployees.find(e => e.EmployeeId === id.trim());
                    return (
                      <Badge key={id} variant="outline">
                        {emp ? `${emp.FirstName} ${emp.LastName}` : id.trim()}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Package & Services</p>
                {selectedTransactionDetails.PackageId && selectedTransactionDetails.PackageId !== 'none' && (
                  <p className="font-medium mb-1">
                    Package: {packages.find(p => p.PackageId === selectedTransactionDetails.PackageId)?.PackageName || selectedTransactionDetails.PackageId}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedTransactionDetails.ServiceIdList?.split(',').filter(Boolean).map((id: string) => {
                    const srv = services.find(s => s.ServiceId === id.trim());
                    return (
                      <Badge key={id} variant="secondary">
                        {srv ? srv.ServiceName : id.trim()}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {selectedTransactionDetails.Extras && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">Extras & Notes</p>
                  <p className="font-medium">{selectedTransactionDetails.Extras}</p>
                </div>
              )}

              <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-700">Total Balance:</span>
                  {selectedTransactionDetails.Discount > 0 && (
                    <span className="text-sm text-gray-500 ml-2">({selectedTransactionDetails.Discount}% discount applied)</span>
                  )}
                </div>
                <span className="text-2xl font-bold text-blue-600">₱{selectedTransactionDetails.TotalBalance?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
