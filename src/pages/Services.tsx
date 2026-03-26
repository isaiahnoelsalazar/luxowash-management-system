import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Services() {
  const { services, loading, refreshServices } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    ServiceId: '',
    ServiceName: '',
    ServicePriceSizeS: 0,
    ServicePriceSizeM: 0,
    ServicePriceSizeL: 0,
    ServicePriceSizeXL: 0,
    ServicePriceSizeXXL: 0,
    ServiceStatus: 'Available'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put('/services', formData);
      } else {
        await api.post('/services', formData);
      }
      setIsDialogOpen(false);
      refreshServices();
    } catch (error) {
      console.error('Failed to save service', error);
    }
  };

  const openEdit = (srv: any) => {
    setFormData({
      ServiceId: srv.ServiceId || '',
      ServiceName: srv.ServiceName || '',
      ServicePriceSizeS: srv.ServicePriceSizeS || 0,
      ServicePriceSizeM: srv.ServicePriceSizeM || 0,
      ServicePriceSizeL: srv.ServicePriceSizeL || 0,
      ServicePriceSizeXL: srv.ServicePriceSizeXL || 0,
      ServicePriceSizeXXL: srv.ServicePriceSizeXXL || 0,
      ServiceStatus: srv.ServiceStatus || 'Available'
    });
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setFormData({
      ServiceId: '',
      ServiceName: '',
      ServicePriceSizeS: 0,
      ServicePriceSizeM: 0,
      ServicePriceSizeL: 0,
      ServicePriceSizeXL: 0,
      ServicePriceSizeXXL: 0,
      ServiceStatus: 'Available'
    });
    setIsEdit(false);
    setIsDialogOpen(true);
  };

  const filteredServices = services.filter(srv => {
    const name = (srv.ServiceName || '').toLowerCase();
    const id = (srv.ServiceId || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || id.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <Button onClick={openAdd}>Add Service</Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search services..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit Service' : 'Add Service'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service ID</Label>
                  <Input 
                    value={formData.ServiceId} 
                    onChange={e => setFormData({...formData, ServiceId: e.target.value})} 
                    required 
                    disabled={isEdit}
                    placeholder="e.g. S_BWV"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input 
                    value={formData.ServiceName} 
                    onChange={e => setFormData({...formData, ServiceName: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price (Size S)</Label>
                  <Input 
                    type="number" 
                    value={formData.ServicePriceSizeS} 
                    onChange={e => setFormData({...formData, ServicePriceSizeS: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size M)</Label>
                  <Input 
                    type="number" 
                    value={formData.ServicePriceSizeM} 
                    onChange={e => setFormData({...formData, ServicePriceSizeM: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size L)</Label>
                  <Input 
                    type="number" 
                    value={formData.ServicePriceSizeL} 
                    onChange={e => setFormData({...formData, ServicePriceSizeL: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size XL)</Label>
                  <Input 
                    type="number" 
                    value={formData.ServicePriceSizeXL} 
                    onChange={e => setFormData({...formData, ServicePriceSizeXL: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size XXL)</Label>
                  <Input 
                    type="number" 
                    value={formData.ServicePriceSizeXXL} 
                    onChange={e => setFormData({...formData, ServicePriceSizeXXL: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.ServiceStatus} 
                    onValueChange={(val) => setFormData({...formData, ServiceStatus: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>S</TableHead>
              <TableHead>M</TableHead>
              <TableHead>L</TableHead>
              <TableHead>XL</TableHead>
              <TableHead>XXL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">Loading services...</TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">No services found.</TableCell>
              </TableRow>
            ) : (
              filteredServices.map((srv, index) => (
                <TableRow key={`${srv.ServiceId}-${index}`}>
                  <TableCell className="font-medium">{srv.ServiceId}</TableCell>
                  <TableCell>{srv.ServiceName}</TableCell>
                  <TableCell>{srv.ServicePriceSizeS === -1 ? '' : `₱${srv.ServicePriceSizeS}`}</TableCell>
                  <TableCell>{srv.ServicePriceSizeM === -1 ? '' : `₱${srv.ServicePriceSizeM}`}</TableCell>
                  <TableCell>{srv.ServicePriceSizeL === -1 ? '' : `₱${srv.ServicePriceSizeL}`}</TableCell>
                  <TableCell>{srv.ServicePriceSizeXL === -1 ? '' : `₱${srv.ServicePriceSizeXL}`}</TableCell>
                  <TableCell>{srv.ServicePriceSizeXXL === -1 ? '' : `₱${srv.ServicePriceSizeXXL}`}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${srv.ServiceStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {srv.ServiceStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openEdit(srv)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
