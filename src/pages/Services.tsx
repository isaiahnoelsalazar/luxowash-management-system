import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import modelsText from '@/src/models.txt?raw';

const parsedModels = modelsText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
  const [brand, model] = line.split(':');
  return { brand: brand?.trim(), model: model?.trim() };
});
const uniqueBrands = Array.from(new Set(parsedModels.map(m => m.brand).filter(Boolean)));

export default function Services() {
  const { services, loading, refreshServices } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSpecialPriceDialogOpen, setIsSpecialPriceDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialPrices, setSpecialPrices] = useState<any[]>([]);
  const [specialPriceForm, setSpecialPriceForm] = useState({
    ServiceId: '',
    VehicleBrand: '',
    VehicleModel: '',
    SpecialPrice: 0
  });
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

  useEffect(() => {
    fetchSpecialPrices();
  }, []);

  const fetchSpecialPrices = async () => {
    try {
      const res = await api.get('/service-special-prices');
      setSpecialPrices(res);
    } catch (error) {
      console.error('Failed to fetch special prices', error);
    }
  };

  const handleSpecialPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/service-special-prices', specialPriceForm);
      toast.success('Special price saved');
      fetchSpecialPrices();
      setSpecialPriceForm({
        ServiceId: '',
        VehicleBrand: '',
        VehicleModel: '',
        SpecialPrice: 0
      });
    } catch (error) {
      toast.error('Failed to save special price');
    }
  };

  const handleDeleteSpecialPrice = async (sp: any) => {
    if (!confirm('Are you sure you want to delete this special price?')) return;
    try {
      await api.delete('/service-special-prices', { data: sp });
      toast.success('Special price deleted');
      fetchSpecialPrices();
    } catch (error) {
      toast.error('Failed to delete special price');
    }
  };

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
        <h1 className="text-3xl font-bold text-primary">Services</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsSpecialPriceDialogOpen(true)}>Manage Special Prices</Button>
          <Button onClick={openAdd}>Add Service</Button>
        </div>
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
          <DialogContent className="sm:max-w-[600px]">
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

      <Dialog open={isSpecialPriceDialogOpen} onOpenChange={setIsSpecialPriceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Special Prices</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Add/Update Special Price</h3>
              <form onSubmit={handleSpecialPriceSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select 
                    value={specialPriceForm.ServiceId} 
                    onValueChange={(val) => setSpecialPriceForm({...specialPriceForm, ServiceId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem key={s.ServiceId} value={s.ServiceId}>{s.ServiceName} ({s.ServiceId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Brand</Label>
                  <Input 
                    list="special-brands"
                    value={specialPriceForm.VehicleBrand} 
                    onChange={e => setSpecialPriceForm({...specialPriceForm, VehicleBrand: e.target.value})} 
                    required 
                  />
                  <datalist id="special-brands">
                    {uniqueBrands.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Model</Label>
                  <Input 
                    list="special-models"
                    value={specialPriceForm.VehicleModel} 
                    onChange={e => setSpecialPriceForm({...specialPriceForm, VehicleModel: e.target.value})} 
                    required 
                  />
                  <datalist id="special-models">
                    {parsedModels
                      .filter(m => m.brand === specialPriceForm.VehicleBrand)
                      .map(m => m.model)
                      .filter(Boolean)
                      .map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Special Price</Label>
                  <Input 
                    type="number" 
                    value={specialPriceForm.SpecialPrice} 
                    onChange={e => setSpecialPriceForm({...specialPriceForm, SpecialPrice: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full">Save Special Price</Button>
              </form>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Current Special Prices</h3>
              <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialPrices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No special prices set.</TableCell>
                      </TableRow>
                    ) : (
                      specialPrices.map((sp, i) => (
                        <TableRow key={i}>
                          <TableCell>{sp.ServiceId}</TableCell>
                          <TableCell>{sp.VehicleBrand} {sp.VehicleModel}</TableCell>
                          <TableCell>₱{sp.SpecialPrice}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSpecialPrice(sp)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm overflow-hidden">
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
                <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">Loading services...</TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">No services found.</TableCell>
              </TableRow>
            ) : (
              filteredServices.map((srv, index) => (
                <TableRow key={`${srv.ServiceId}-${index}`}>
                  <TableCell className="font-medium text-foreground">{srv.ServiceId}</TableCell>
                  <TableCell className="text-foreground">{srv.ServiceName}</TableCell>
                  <TableCell className="text-foreground">{srv.ServicePriceSizeS === -1 ? '' : `₱${srv.ServicePriceSizeS}`}</TableCell>
                  <TableCell className="text-foreground">{srv.ServicePriceSizeM === -1 ? '' : `₱${srv.ServicePriceSizeM}`}</TableCell>
                  <TableCell className="text-foreground">{srv.ServicePriceSizeL === -1 ? '' : `₱${srv.ServicePriceSizeL}`}</TableCell>
                  <TableCell className="text-foreground">{srv.ServicePriceSizeXL === -1 ? '' : `₱${srv.ServicePriceSizeXL}`}</TableCell>
                  <TableCell className="text-foreground">{srv.ServicePriceSizeXXL === -1 ? '' : `₱${srv.ServicePriceSizeXXL}`}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      srv.ServiceStatus === 'Available' 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "bg-destructive/10 text-destructive"
                    )}>
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
