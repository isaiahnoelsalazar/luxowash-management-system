import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Packages() {
  const { packages, loading, refreshPackages } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    PackageId: '',
    PackageName: '',
    PackageDetails: '',
    PackagePriceSizeS: 0,
    PackagePriceSizeM: 0,
    PackagePriceSizeL: 0,
    PackagePriceSizeXL: 0,
    PackagePriceSizeXXL: 0,
    PackageStatus: 'Available'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put('/packages', formData);
      } else {
        await api.post('/packages', formData);
      }
      setIsDialogOpen(false);
      refreshPackages();
    } catch (error) {
      console.error('Failed to save package', error);
    }
  };

  const openEdit = (pkg: any) => {
    setFormData({
      PackageId: pkg.PackageId || '',
      PackageName: pkg.PackageName || '',
      PackageDetails: pkg.PackageDetails || '',
      PackagePriceSizeS: pkg.PackagePriceSizeS || 0,
      PackagePriceSizeM: pkg.PackagePriceSizeM || 0,
      PackagePriceSizeL: pkg.PackagePriceSizeL || 0,
      PackagePriceSizeXL: pkg.PackagePriceSizeXL || 0,
      PackagePriceSizeXXL: pkg.PackagePriceSizeXXL || 0,
      PackageStatus: pkg.PackageStatus || 'Available'
    });
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setFormData({
      PackageId: '',
      PackageName: '',
      PackageDetails: '',
      PackagePriceSizeS: 0,
      PackagePriceSizeM: 0,
      PackagePriceSizeL: 0,
      PackagePriceSizeXL: 0,
      PackagePriceSizeXXL: 0,
      PackageStatus: 'Available'
    });
    setIsEdit(false);
    setIsDialogOpen(true);
  };

  const filteredPackages = packages.filter(pkg => {
    const name = (pkg.PackageName || '').toLowerCase();
    const id = (pkg.PackageId || '').toLowerCase();
    const details = (pkg.PackageDetails || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || id.includes(query) || details.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
        <Button onClick={openAdd}>Add Package</Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search packages..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit Package' : 'Add Package'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Package ID</Label>
                  <Input 
                    value={formData.PackageId} 
                    onChange={e => setFormData({...formData, PackageId: e.target.value})} 
                    required 
                    disabled={isEdit}
                    placeholder="e.g. P_B"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Package Name</Label>
                  <Input 
                    value={formData.PackageName} 
                    onChange={e => setFormData({...formData, PackageName: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Package Details (comma separated)</Label>
                <Input 
                  value={formData.PackageDetails} 
                  onChange={e => setFormData({...formData, PackageDetails: e.target.value})} 
                  placeholder="Wash,Armor All,Hand Wax"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price (Size S)</Label>
                  <Input 
                    type="number" 
                    value={formData.PackagePriceSizeS} 
                    onChange={e => setFormData({...formData, PackagePriceSizeS: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size M)</Label>
                  <Input 
                    type="number" 
                    value={formData.PackagePriceSizeM} 
                    onChange={e => setFormData({...formData, PackagePriceSizeM: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size L)</Label>
                  <Input 
                    type="number" 
                    value={formData.PackagePriceSizeL} 
                    onChange={e => setFormData({...formData, PackagePriceSizeL: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size XL)</Label>
                  <Input 
                    type="number" 
                    value={formData.PackagePriceSizeXL} 
                    onChange={e => setFormData({...formData, PackagePriceSizeXL: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Size XXL)</Label>
                  <Input 
                    type="number" 
                    value={formData.PackagePriceSizeXXL} 
                    onChange={e => setFormData({...formData, PackagePriceSizeXXL: parseFloat(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.PackageStatus} 
                    onValueChange={(val) => setFormData({...formData, PackageStatus: val})}
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
              <TableHead>Details</TableHead>
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
                <TableCell colSpan={10} className="text-center py-4">Loading packages...</TableCell>
              </TableRow>
            ) : filteredPackages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">No packages found.</TableCell>
              </TableRow>
            ) : (
              filteredPackages.map((pkg, index) => (
                <TableRow key={`${pkg.PackageId}-${index}`}>
                  <TableCell className="font-medium">{pkg.PackageId}</TableCell>
                  <TableCell>{pkg.PackageName}</TableCell>
                  <TableCell className="max-w-xs truncate" title={pkg.PackageDetails}>{pkg.PackageDetails}</TableCell>
                  <TableCell>₱{pkg.PackagePriceSizeS}</TableCell>
                  <TableCell>₱{pkg.PackagePriceSizeM}</TableCell>
                  <TableCell>₱{pkg.PackagePriceSizeL}</TableCell>
                  <TableCell>₱{pkg.PackagePriceSizeXL}</TableCell>
                  <TableCell>₱{pkg.PackagePriceSizeXXL}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${pkg.PackageStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {pkg.PackageStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openEdit(pkg)}>Edit</Button>
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
