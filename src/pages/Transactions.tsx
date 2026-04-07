import React, { useState, useEffect } from 'react';
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
  const { transactions, activeEmployees, employees: allEmployees, vehicles, services, packages, extras: availableExtras, loading, refreshTransactions, fetchAll } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<{[name: string]: number}>({});
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedExtras, setSelectedExtras] = useState<{[key: string]: number}>({});

  // Reset services and package when vehicle changes
  React.useEffect(() => {
    setSelectedServices({});
    setSelectedPackage('');
    setSelectedExtras({});
  }, [selectedVehicle]);
  const [discount, setDiscount] = useState<number>(0);
  const [customExtras, setCustomExtras] = useState<string>('');
  const [truckPrice, setTruckPrice] = useState<number>(0);
  const [truckNotes, setTruckNotes] = useState<string>('');
  const [specialPrices, setSpecialPrices] = useState<any[]>([]);

  useEffect(() => {
    const fetchSpecialPrices = async () => {
      try {
        const res = await api.get('/service-special-prices');
        setSpecialPrices(res);
      } catch (error) {
        console.error('Failed to fetch special prices', error);
      }
    };
    fetchSpecialPrices();
  }, []);

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
      const newServices = { ...selectedServices };
      includedServices.forEach(srv => delete newServices[srv]);
      setSelectedServices(newServices);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    const vehicle = vehicles.find(v => `${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}` === selectedVehicle);
    
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
      Object.entries(selectedServices).forEach(([srvName, qty]) => {
        if (!includedServices.includes(srvName)) {
          const srv = services.find(s => s.ServiceName === srvName);
          if (srv) {
            // Check for special pricing from database
            const specialPrice = specialPrices.find(sp => 
              sp.ServiceId === srv.ServiceId && 
              sp.VehicleBrand === vehicle?.VehicleBrand && 
              sp.VehicleModel === vehicle?.VehicleModel
            );

            let price = 0;
            if (specialPrice) {
              price = Number(specialPrice.SpecialPrice);
            } else if (vehicle?.VehicleModel === 'MOTORCYCLE' && srv.ServiceId === 'S_RBWRM' && size === 'M') {
              price = srv.ServicePriceSizeL || 0;
            } else {
              price = srv[`ServicePrice${sizeKey}`] || 0;
            }
            total += price * Number(qty);
          }
        }
      });
    }

    // Add Extras Price
    Object.entries(selectedExtras).forEach(([extraId, qty]) => {
      const extra = availableExtras.find(e => e.ExtraId === extraId);
      if (extra) {
        const price = Number(extra.ExtraPrice) || 0;
        const quantity = Number(qty);
        total += price * quantity;
      }
    });

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

    const vehicle = vehicles.find(v => `${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}` === selectedVehicle);
    const vehicleId = vehicle?.VehicleId || '';
    
    if (!vehicleId) {
      alert('Selected vehicle not found. Please select a valid vehicle from the list.');
      return;
    }

    const isTruck = vehicle?.VehicleModel === 'TRUCK';
    
    // Format Extras
    const formattedExtras = Object.entries(selectedExtras)
      .map(([extraId, qty]) => {
        const extra = availableExtras.find(e => e.ExtraId === extraId);
        return extra ? `${extra.ExtraName} (${qty})` : '';
      })
      .filter(Boolean)
      .join(', ');

    const finalExtrasList = [formattedExtras, customExtras].filter(Boolean).join(' | ');
    const finalExtras = isTruck ? (finalExtrasList ? `${finalExtrasList} | Notes: ${truckNotes}` : `Notes: ${truckNotes}`) : finalExtrasList;

    const serviceIdList = isTruck ? '' : Object.entries(selectedServices)
      .map(([name, qty]) => {
        const srv = services.find(s => s.ServiceName === name);
        if (!srv) return '';
        const quantity = Number(qty);
        return quantity > 1 ? `${srv.ServiceId}:${quantity}` : srv.ServiceId;
      })
      .filter(Boolean)
      .join(',');

    const payload = {
      EmployeeIdList: selectedEmployees.join(','),
      ServiceIdList: serviceIdList,
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
      fetchAll();
    } catch (error) {
      console.error('Failed to create transaction', error);
    }
  };

  const resetForm = () => {
    setSelectedEmployees([]);
    setSelectedVehicle('');
    setSelectedServices([]);
    setSelectedPackage('');
    setSelectedExtras({});
    setDiscount(0);
    setCustomExtras('');
    setTruckPrice(0);
    setTruckNotes('');
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put('/transactions', { TransactionId: id, TransactionStatus: status });
      fetchAll();
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
        <h1 className="text-3xl font-bold text-primary">Transactions</h1>
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label>Select Vehicle (Available)</Label>
                <Input 
                  list="vehicle-list"
                  value={selectedVehicle} 
                  onChange={e => setSelectedVehicle(e.target.value)} 
                  placeholder="Type plate number or select..."
                  required 
                />
                <datalist id="vehicle-list">
                  {availableVehicles.map(v => (
                    <option key={v.VehicleId} value={`${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}`} />
                  ))}
                </datalist>
              </div>

              {/* Employees Selection */}
              <div className="space-y-2">
                <Label>Assign Employees (Timed In & Available)</Label>
                <div className="grid grid-cols-2 gap-2 border p-4 rounded-md">
                  {availableEmployees.length === 0 && <p className="text-sm text-muted-foreground">No available employees.</p>}
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
              {vehicles.find(v => `${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}` === selectedVehicle)?.VehicleBrand !== 'GENERAL VEHICLE' && (
                <div className="space-y-2">
                  <Label>Select Package (Optional)</Label>
                  <Select value={selectedPackage} onValueChange={handlePackageChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package">
                        {selectedPackage && selectedPackage !== 'none' ? packages.find(p => p.PackageId === selectedPackage)?.PackageName : undefined}
                      </SelectValue>
                    </SelectTrigger>
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
              {vehicles.find(v => `${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}` === selectedVehicle)?.VehicleModel !== 'TRUCK' && (
                <div className="space-y-2">
                  <Label>Additional Services</Label>
                  <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                    {services.filter(srv => {
                      const vehicle = vehicles.find(v => `${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}` === selectedVehicle);
                      if (!vehicle) return true;
                      
                      const brand = vehicle.VehicleBrand;
                      const model = vehicle.VehicleModel;

                      // Rule: if brand is not "GENERAL VEHICLE" then do not show [S_VCBWE, S_VCBWM, S_VCBWT, S_VCBWP, S_VCA, S_VCW]
                      const restrictedServices = ['S_VCBWE', 'S_VCBWM', 'S_VCBWT', 'S_VCBWP', 'S_VCA', 'S_VCW'];
                      if (brand !== 'GENERAL VEHICLE' && restrictedServices.includes(srv.ServiceId)) {
                        return false;
                      }

                      // Rule: if model is MOTORCYCLE, show S_RBWRM else do not show
                      if (srv.ServiceId === 'S_RBWRM') {
                        return model === 'MOTORCYCLE';
                      }

                      // Existing model-specific logic
                      if (model === 'E-BIKE') return ['S_VCBWE', 'S_VCA', 'S_VCW'].includes(srv.ServiceId);
                      if (model === 'MOTORCYCLE') return ['S_RBWRM', 'S_VCBWM', 'S_VCA', 'S_VCW'].includes(srv.ServiceId);
                      if (model === 'TRICYCLE') return srv.ServiceId === 'S_VCBWT';
                      if (model === 'PUV (JEEP)') return srv.ServiceId === 'S_VCBWP';
                      
                      return true;
                    }).map(srv => {
                      const isIncluded = getServicesInPackage(selectedPackage).includes(srv.ServiceName);
                      return (
                        <div key={srv.ServiceName} className="flex items-center justify-between py-1 border-b last:border-0">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`srv-${srv.ServiceName}`} 
                              checked={isIncluded || !!selectedServices[srv.ServiceName]}
                              disabled={isIncluded}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedServices({...selectedServices, [srv.ServiceName]: 1});
                                else {
                                  const newServices = { ...selectedServices };
                                  delete newServices[srv.ServiceName];
                                  setSelectedServices(newServices);
                                }
                              }}
                            />
                            <label htmlFor={`srv-${srv.ServiceName}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {srv.ServiceName} {isIncluded && <span className="text-xs text-blue-500 ml-1">(Included)</span>}
                            </label>
                          </div>
                          {selectedServices[srv.ServiceName] && srv.ServiceId === 'S_RBWPPPSA' && (
                            <div className="flex items-center space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => setSelectedServices({ ...selectedServices, [srv.ServiceName]: Math.max(1, selectedServices[srv.ServiceName] - 1) })}
                              >
                                -
                              </Button>
                              <span className="text-sm w-4 text-center">{selectedServices[srv.ServiceName]}</span>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => setSelectedServices({ ...selectedServices, [srv.ServiceName]: selectedServices[srv.ServiceName] + 1 })}
                              >
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Truck Specific Fields */}
              {vehicles.find(v => `${v.PlateNumber} - ${v.VehicleBrand} ${v.VehicleModel}` === selectedVehicle)?.VehicleModel === 'TRUCK' && (
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
              <div className="space-y-4">
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
                    <Label>Other Extras (Manual Entry)</Label>
                    <Input 
                      value={customExtras} 
                      onChange={e => setCustomExtras(e.target.value)} 
                      placeholder="e.g. Special Request"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Managed Extras</Label>
                  <div className="grid grid-cols-1 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                    {availableExtras.filter(e => e.ExtraStatus === 'Available').map(extra => (
                      <div key={extra.ExtraId} className="flex items-center justify-between py-1 border-b last:border-0">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`extra-${extra.ExtraId}`} 
                            checked={!!selectedExtras[extra.ExtraId]}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExtras({ ...selectedExtras, [extra.ExtraId]: 1 });
                              } else {
                                const newExtras = { ...selectedExtras };
                                delete newExtras[extra.ExtraId];
                                setSelectedExtras(newExtras);
                              }
                            }}
                          />
                          <label htmlFor={`extra-${extra.ExtraId}`} className="text-sm font-medium leading-none">
                            {extra.ExtraName} (₱{Number(extra.ExtraPrice)})
                          </label>
                        </div>
                        {selectedExtras[extra.ExtraId] && (
                          <div className="flex items-center space-x-2">
                            {extra.ExtraType === 'Per Piece' ? (
                              <>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => setSelectedExtras({ ...selectedExtras, [extra.ExtraId]: Math.max(1, selectedExtras[extra.ExtraId] - 1) })}
                                >
                                  -
                                </Button>
                                <span className="text-sm w-4 text-center">{selectedExtras[extra.ExtraId]}</span>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => setSelectedExtras({ ...selectedExtras, [extra.ExtraId]: selectedExtras[extra.ExtraId] + 1 })}
                                >
                                  +
                                </Button>
                              </>
                            ) : (
                              <Badge variant="secondary">1 Vehicle</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {availableExtras.length === 0 && <p className="text-sm text-muted-foreground">No extras available.</p>}
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-foreground">Estimated Total:</span>
                <span className="text-2xl font-bold text-primary">₱{calculateTotal().toLocaleString()}</span>
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
                      <Select 
                        value={t.TransactionStatus} 
                        onValueChange={(val) => updateStatus(t.TransactionId, val)}
                        disabled={t.TransactionStatus === 'Completed' || t.TransactionStatus === 'Cancelled'}
                      >
                        <SelectTrigger className="w-[140px] inline-flex h-8">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {t.TransactionStatus === 'Ready' && (
                            <>
                              <SelectItem value="Ready">Ready</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </>
                          )}
                          {t.TransactionStatus === 'In Progress' && (
                            <>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </>
                          )}
                          {(t.TransactionStatus === 'Completed' || t.TransactionStatus === 'Cancelled') && (
                            <SelectItem value={t.TransactionStatus}>{t.TransactionStatus}</SelectItem>
                          )}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransactionDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-medium text-foreground">{selectedTransactionDetails.TransactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{selectedTransactionDetails.DateCreated ? format(new Date(selectedTransactionDetails.DateCreated), 'MMM d, yyyy h:mm a') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium text-foreground">
                    {vehicles.find(v => v.VehicleId === selectedTransactionDetails.VehicleId)?.PlateNumber || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedTransactionDetails.TransactionStatus === 'Completed' ? 'default' : selectedTransactionDetails.TransactionStatus === 'Cancelled' ? 'destructive' : 'secondary'}>
                    {selectedTransactionDetails.TransactionStatus}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Assigned Employees</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTransactionDetails.EmployeeIdList?.split(',').map((id: string) => {
                    const emp = allEmployees.find(e => e.EmployeeId === id.trim());
                    return (
                      <Badge key={id} variant="outline" className="text-foreground border-border">
                        {emp ? `${emp.FirstName} ${emp.LastName}` : id.trim()}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Package & Services</p>
                {selectedTransactionDetails.PackageId && selectedTransactionDetails.PackageId !== 'none' && (
                  <p className="font-medium text-foreground mb-1">
                    Package: {packages.find(p => p.PackageId === selectedTransactionDetails.PackageId)?.PackageName || selectedTransactionDetails.PackageId}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedTransactionDetails.ServiceIdList?.split(',').filter(Boolean).map((id: string) => {
                    const srv = services.find(s => s.ServiceId === id.trim());
                    return (
                      <Badge key={id} variant="secondary" className="text-foreground">
                        {srv ? srv.ServiceName : id.trim()}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {selectedTransactionDetails.Extras && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Extras & Notes</p>
                  <p className="font-medium text-foreground">{selectedTransactionDetails.Extras}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
