import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gift, RefreshCw, UserPlus, Trash2 } from 'lucide-react';
import modelsText from '@/src/models.txt?raw';
import { toast } from 'sonner';

const parsedModels = modelsText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
  const [brand, model] = line.split(':');
  return { brand: brand?.trim(), model: model?.trim() };
});
const uniqueBrands = Array.from(new Set(parsedModels.map(m => m.brand).filter(Boolean)));

export default function Customers() {
  const { customers, vehicles, loading, refreshCustomers, refreshVehicles } = useData();
  const navigate = useNavigate();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isConfirmVehicleDialogOpen, setIsConfirmVehicleDialogOpen] = useState(false);
  const [isConfirmTransactionDialogOpen, setIsConfirmTransactionDialogOpen] = useState(false);
  const [newlyCreatedCustomerId, setNewlyCreatedCustomerId] = useState<string | null>(null);
  const [newlyCreatedVehicleId, setNewlyCreatedVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [referralThreshold, setReferralThreshold] = useState(5);
  const currentUser = JSON.parse(localStorage.getItem('luxowash_user') || '{}');
  const isAdmin = currentUser.role === 'admin';
  
  const [customerForm, setCustomerForm] = useState({
    CustomerId: '', LastName: '', FirstName: '', MiddleName: '', MobileNumber: '', CustomerAddress: '', ReferralCode: '', ReferredBy: ''
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    VehicleId: '', VehicleBrand: '', VehicleModel: '', VehicleSize: 'M', PlateNumber: '', CustomerId: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.ReferralThreshold) {
          setReferralThreshold(parseInt(res.ReferralThreshold));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (customerForm.CustomerId) {
        res = await api.put('/customers', customerForm);
      } else {
        res = await api.post('/customers', customerForm);
      }
      setIsCustomerDialogOpen(false);
      refreshCustomers();
      toast.success('Customer saved successfully');
      
      if (!customerForm.CustomerId && res.CustomerId) {
        // New customer added, ask to add vehicle
        setNewlyCreatedCustomerId(res.CustomerId);
        setIsConfirmVehicleDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Failed to save customer', error);
      toast.error(error.message || 'Failed to save customer');
    }
  };

  const generateReferralCode = (cust: any) => {
    const code = (cust.FirstName.substring(0, 2) + cust.LastName.substring(0, 2) + Math.random().toString(36).substring(2, 6)).toUpperCase();
    setCustomerForm({ ...cust, ReferralCode: code });
    // If we are editing, we can save it directly or let the user save the form
    if (cust.CustomerId) {
      api.put('/customers', { ...cust, ReferralCode: code }).then(() => {
        refreshCustomers();
        toast.success('Referral code generated');
      });
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isNew = !vehicleForm.VehicleId;
      let res;
      if (vehicleForm.VehicleId) {
        res = await api.put('/vehicles', vehicleForm);
      } else {
        res = await api.post('/vehicles', vehicleForm);
      }
      setIsVehicleDialogOpen(false);
      refreshVehicles();
      toast.success('Vehicle saved successfully');
      
      if (isNew && res.VehicleId) {
        setNewlyCreatedVehicleId(res.VehicleId);
        setIsConfirmTransactionDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Failed to save vehicle', error);
      toast.error(error.message || 'Failed to save vehicle');
    }
  };

  const openEditCustomer = (cust: any) => {
    setCustomerForm({
      ...cust,
      ReferralCode: cust.ReferralCode || '',
      ReferredBy: cust.ReferredBy || ''
    });
    setIsCustomerDialogOpen(true);
  };

  const openAddCustomer = () => {
    setCustomerForm({ CustomerId: '', LastName: '', FirstName: '', MiddleName: '', MobileNumber: '', CustomerAddress: '', ReferralCode: '', ReferredBy: '' });
    setIsCustomerDialogOpen(true);
  };

  const openAddVehicle = (customerId: string) => {
    setVehicleForm({ VehicleId: '', VehicleBrand: '', VehicleModel: '', VehicleSize: 'M', PlateNumber: '', CustomerId: customerId });
    setIsVehicleDialogOpen(true);
  };

  const openEditVehicle = (veh: any) => {
    let size = veh.VehicleSize;
    if (veh.VehicleModel === 'TRUCK') size = 'N/A';
    else if (veh.VehicleModel === 'TRICYCLE' || veh.VehicleModel === 'PUV (JEEP)') size = 'M';
    else if ((veh.VehicleModel === 'E-BIKE' || veh.VehicleModel === 'MOTORCYCLE') && !['S', 'M', 'L'].includes(size)) size = 'M';
    
    setVehicleForm({ ...veh, VehicleSize: size });
    setIsVehicleDialogOpen(true);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      refreshVehicles();
      toast.success('Vehicle deleted successfully');
    } catch (error) {
      console.error('Failed to delete vehicle', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const name = `${cust.FirstName} ${cust.LastName}`.toLowerCase();
    const contact = (cust.MobileNumber || '').toLowerCase();
    const referral = (cust.ReferralCode || '').toLowerCase();
    const custVehicles = vehicles.filter(v => v.CustomerId === cust.CustomerId);
    const plates = custVehicles.map(v => v.PlateNumber.toLowerCase()).join(' ');
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || contact.includes(query) || plates.includes(query) || referral.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Customers & Vehicles</h1>
        <Button onClick={openAddCustomer}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add New Customer
        </Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search customers, plates, or referral codes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md bg-background text-foreground"
        />
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
          <DialogHeader>
            <DialogTitle>{customerForm.CustomerId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={customerForm.FirstName} onChange={e => setCustomerForm({...customerForm, FirstName: e.target.value})} required minLength={2} maxLength={50} className="bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={customerForm.LastName} onChange={e => setCustomerForm({...customerForm, LastName: e.target.value})} required minLength={2} maxLength={50} className="bg-background text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={customerForm.MobileNumber || ''} onChange={e => setCustomerForm({...customerForm, MobileNumber: e.target.value})} pattern="[0-9+\-\s()]+" title="Only numbers, spaces, and + - ( ) are allowed" maxLength={20} className="bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Referred By (Code)</Label>
                <Input value={customerForm.ReferredBy || ''} onChange={e => setCustomerForm({...customerForm, ReferredBy: e.target.value.toUpperCase()})} placeholder="Enter referral code" maxLength={20} className="bg-background text-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={customerForm.CustomerAddress || ''} onChange={e => setCustomerForm({...customerForm, CustomerAddress: e.target.value})} maxLength={200} className="bg-background text-foreground" />
            </div>
            {customerForm.CustomerId && (
              <div className="space-y-2">
                <Label>Referral Code</Label>
                <div className="flex gap-2">
                  <Input value={customerForm.ReferralCode || ''} readOnly className="bg-muted text-foreground" placeholder="No code generated" />
                  <Button type="button" variant="outline" onClick={() => generateReferralCode(customerForm)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full">Save Customer</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
          <DialogHeader>
            <DialogTitle>{vehicleForm.VehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVehicleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input 
                  list="vehicle-brands"
                  value={vehicleForm.VehicleBrand} 
                  onChange={e => setVehicleForm({...vehicleForm, VehicleBrand: e.target.value})} 
                  required 
                  className="bg-background text-foreground"
                />
                <datalist id="vehicle-brands">
                  {uniqueBrands.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input 
                  list="vehicle-models"
                  value={vehicleForm.VehicleModel} 
                  onChange={e => {
                    const newModel = e.target.value;
                    let newSize = vehicleForm.VehicleSize;
                    if (newModel === 'TRUCK') newSize = 'N/A';
                    else if (newModel === 'TRICYCLE' || newModel === 'PUV (JEEP)') newSize = 'M';
                    else if ((newModel === 'E-BIKE' || newModel === 'MOTORCYCLE') && !['S', 'M', 'L'].includes(newSize)) newSize = 'M';
                    else if (newSize === 'N/A') newSize = 'M';
                    
                    setVehicleForm({...vehicleForm, VehicleModel: newModel, VehicleSize: newSize});
                  }} 
                  required 
                  className="bg-background text-foreground"
                />
                <datalist id="vehicle-models">
                  {parsedModels
                    .filter(m => m.brand === vehicleForm.VehicleBrand)
                    .map(m => m.model)
                    .filter(Boolean)
                    .map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input value={vehicleForm.PlateNumber} onChange={e => setVehicleForm({...vehicleForm, PlateNumber: e.target.value.toUpperCase()})} required maxLength={20} pattern="[A-Z0-9\-\s]+" title="Only uppercase letters, numbers, spaces, and hyphens are allowed" className="bg-background text-foreground" />
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <Select 
                  value={vehicleForm.VehicleSize} 
                  onValueChange={v => setVehicleForm({...vehicleForm, VehicleSize: v})}
                  disabled={vehicleForm.VehicleModel === 'TRUCK' || vehicleForm.VehicleModel === 'TRICYCLE' || vehicleForm.VehicleModel === 'PUV (JEEP)'}
                >
                  <SelectTrigger className="bg-background text-foreground"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent className="bg-background text-foreground">
                    {vehicleForm.VehicleModel === 'TRUCK' ? (
                      <SelectItem value="N/A">N/A</SelectItem>
                    ) : vehicleForm.VehicleModel === 'TRICYCLE' || vehicleForm.VehicleModel === 'PUV (JEEP)' ? (
                      <SelectItem value="M">Medium (M)</SelectItem>
                    ) : vehicleForm.VehicleModel === 'E-BIKE' || vehicleForm.VehicleModel === 'MOTORCYCLE' ? (
                      <>
                        <SelectItem value="S">Small (S)</SelectItem>
                        <SelectItem value="M">Medium (M)</SelectItem>
                        <SelectItem value="L">Large (L)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="S">Small (S)</SelectItem>
                        <SelectItem value="M">Medium (M)</SelectItem>
                        <SelectItem value="L">Large (L)</SelectItem>
                        <SelectItem value="XL">Extra Large (XL)</SelectItem>
                        <SelectItem value="XXL">XXL</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full">Save Vehicle</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        {filteredCustomers.map(cust => {
          const custVehicles = vehicles.filter(v => v.CustomerId === cust.CustomerId);
          const isEligible = cust.ReferralCount >= referralThreshold;
          return (
            <Card key={cust.CustomerId} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground">{cust.FirstName} {cust.LastName}</CardTitle>
                    {cust.ReferralCode && (
                      <Badge variant="secondary" className="font-mono">
                        {cust.ReferralCode}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{cust.MobileNumber || 'No contact info'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {cust.ReferralCount || 0} Referrals
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEligible && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white animate-pulse">
                      Discount Eligible!
                    </Badge>
                  )}
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Button variant="outline" onClick={() => openEditCustomer(cust)}>Edit Info</Button>
                    )}
                    <Button onClick={() => openAddVehicle(cust.CustomerId)}>Add Vehicle</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEligible && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-600 dark:text-green-400 text-sm font-medium">
                    <Gift className="w-5 h-5" />
                    This customer has reached the referral threshold ({referralThreshold}) and is eligible for a discount!
                  </div>
                )}
                {custVehicles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-muted-foreground">Plate Number</TableHead>
                        <TableHead className="text-muted-foreground">Brand</TableHead>
                        <TableHead className="text-muted-foreground">Model</TableHead>
                        <TableHead className="text-muted-foreground">Size</TableHead>
                        <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {custVehicles.map(veh => (
                        <TableRow key={veh.VehicleId} className="border-border">
                          <TableCell className="font-medium text-foreground">{veh.PlateNumber}</TableCell>
                          <TableCell className="text-foreground">{veh.VehicleBrand}</TableCell>
                          <TableCell className="text-foreground">{veh.VehicleModel}</TableCell>
                          <TableCell className="text-foreground">{veh.VehicleSize}</TableCell>
                          <TableCell className="text-right">
                            {isAdmin && (
                              <>
                                <Button variant="ghost" onClick={() => openEditVehicle(veh)} className="text-foreground hover:bg-accent">Edit</Button>
                                <Button variant="ghost" onClick={() => handleDeleteVehicle(veh.VehicleId)} className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-2">
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-2">No vehicles registered.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Confirm Add Vehicle Dialog */}
      <Dialog open={isConfirmVehicleDialogOpen} onOpenChange={setIsConfirmVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Vehicle?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">Customer added successfully! Would you like to add a vehicle for this customer now?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsConfirmVehicleDialogOpen(false)}>Later</Button>
              <Button onClick={() => {
                setIsConfirmVehicleDialogOpen(false);
                if (newlyCreatedCustomerId) openAddVehicle(newlyCreatedCustomerId);
              }}>Add Now</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Confirm Add Transaction Dialog */}
      <Dialog open={isConfirmTransactionDialogOpen} onOpenChange={setIsConfirmTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Transaction?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">Vehicle added successfully! Would you like to proceed with creating a new transaction for this vehicle?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsConfirmTransactionDialogOpen(false)}>Later</Button>
              <Button onClick={() => {
                setIsConfirmTransactionDialogOpen(false);
                navigate(`/transactions?new=true${newlyCreatedVehicleId ? `&vehicleId=${newlyCreatedVehicleId}` : ''}`);
              }}>Create Transaction</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
