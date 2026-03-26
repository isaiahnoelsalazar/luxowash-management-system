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
import modelsText from '@/src/models.txt?raw';

const parsedModels = modelsText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
  const [brand, model] = line.split(':');
  return { brand: brand?.trim(), model: model?.trim() };
});
const uniqueBrands = Array.from(new Set(parsedModels.map(m => m.brand).filter(Boolean)));

export default function Customers() {
  const { customers, vehicles, loading, refreshCustomers, refreshVehicles } = useData();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customerForm, setCustomerForm] = useState({
    CustomerId: '', LastName: '', FirstName: '', MiddleName: '', MobileNumber: '', CustomerAddress: ''
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    VehicleId: '', VehicleBrand: '', VehicleModel: '', VehicleSize: 'M', PlateNumber: '', CustomerId: ''
  });

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customerForm.CustomerId) {
        await api.put('/customers', customerForm);
      } else {
        await api.post('/customers', customerForm);
      }
      setIsCustomerDialogOpen(false);
      refreshCustomers();
    } catch (error) {
      console.error('Failed to save customer', error);
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (vehicleForm.VehicleId) {
        await api.put('/vehicles', vehicleForm);
      } else {
        await api.post('/vehicles', vehicleForm);
      }
      setIsVehicleDialogOpen(false);
      refreshVehicles();
    } catch (error) {
      console.error('Failed to save vehicle', error);
    }
  };

  const openEditCustomer = (cust: any) => {
    setCustomerForm(cust);
    setIsCustomerDialogOpen(true);
  };

  const openAddCustomer = () => {
    setCustomerForm({ CustomerId: '', LastName: '', FirstName: '', MiddleName: '', MobileNumber: '', CustomerAddress: '' });
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

  const filteredCustomers = customers.filter(cust => {
    const name = `${cust.FirstName} ${cust.LastName}`.toLowerCase();
    const contact = (cust.MobileNumber || '').toLowerCase();
    const custVehicles = vehicles.filter(v => v.CustomerId === cust.CustomerId);
    const plates = custVehicles.map(v => v.PlateNumber.toLowerCase()).join(' ');
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || contact.includes(query) || plates.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Customers & Vehicles</h1>
        <Button onClick={openAddCustomer}>Add New Customer</Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search customers or plates..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{customerForm.CustomerId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={customerForm.FirstName} onChange={e => setCustomerForm({...customerForm, FirstName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={customerForm.LastName} onChange={e => setCustomerForm({...customerForm, LastName: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input value={customerForm.MobileNumber || ''} onChange={e => setCustomerForm({...customerForm, MobileNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={customerForm.CustomerAddress || ''} onChange={e => setCustomerForm({...customerForm, CustomerAddress: e.target.value})} />
            </div>
            <Button type="submit" className="w-full">Save Customer</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="max-w-2xl">
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
                <Input value={vehicleForm.PlateNumber} onChange={e => setVehicleForm({...vehicleForm, PlateNumber: e.target.value.toUpperCase()})} required />
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <Select 
                  value={vehicleForm.VehicleSize} 
                  onValueChange={v => setVehicleForm({...vehicleForm, VehicleSize: v})}
                  disabled={vehicleForm.VehicleModel === 'TRUCK' || vehicleForm.VehicleModel === 'TRICYCLE' || vehicleForm.VehicleModel === 'PUV (JEEP)'}
                >
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
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
          return (
            <Card key={cust.CustomerId}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{cust.FirstName} {cust.LastName}</CardTitle>
                  <p className="text-sm text-gray-500">{cust.MobileNumber || 'No contact info'}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditCustomer(cust)}>Edit Info</Button>
                  <Button size="sm" onClick={() => openAddVehicle(cust.CustomerId)}>Add Vehicle</Button>
                </div>
              </CardHeader>
              <CardContent>
                {custVehicles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plate Number</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {custVehicles.map(veh => (
                        <TableRow key={veh.VehicleId}>
                          <TableCell className="font-medium">{veh.PlateNumber}</TableCell>
                          <TableCell>{veh.VehicleBrand}</TableCell>
                          <TableCell>{veh.VehicleModel}</TableCell>
                          <TableCell>{veh.VehicleSize}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openEditVehicle(veh)}>Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 italic py-2">No vehicles registered.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
