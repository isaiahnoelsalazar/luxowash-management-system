import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  
  const [customerForm, setCustomerForm] = useState({
    CustomerId: '', LastName: '', FirstName: '', MiddleName: '', MobileNumber: '', CustomerAddress: ''
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    VehicleId: '', VehicleBrand: '', VehicleModel: '', VehicleSize: 'M', PlateNumber: '', CustomerId: ''
  });

  const fetchData = async () => {
    try {
      const [custRes, vehRes] = await Promise.all([
        api.get('/customers'),
        api.get('/vehicles')
      ]);
      setCustomers(custRes);
      setVehicles(vehRes);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customerForm.CustomerId) {
        await api.put('/customers', customerForm);
      } else {
        await api.post('/customers', customerForm);
      }
      setIsCustomerDialogOpen(false);
      fetchData();
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
      fetchData();
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
    setVehicleForm(veh);
    setIsVehicleDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Customers & Vehicles</h1>
        <Button onClick={openAddCustomer}>Add New Customer</Button>
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{vehicleForm.VehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVehicleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={vehicleForm.VehicleBrand} onChange={e => setVehicleForm({...vehicleForm, VehicleBrand: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={vehicleForm.VehicleModel} onChange={e => setVehicleForm({...vehicleForm, VehicleModel: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input value={vehicleForm.PlateNumber} onChange={e => setVehicleForm({...vehicleForm, PlateNumber: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={vehicleForm.VehicleSize} onValueChange={v => setVehicleForm({...vehicleForm, VehicleSize: v})}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">Small (S)</SelectItem>
                    <SelectItem value="M">Medium (M)</SelectItem>
                    <SelectItem value="L">Large (L)</SelectItem>
                    <SelectItem value="XL">Extra Large (XL)</SelectItem>
                    <SelectItem value="XXL">XXL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full">Save Vehicle</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        {customers.map(cust => {
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
