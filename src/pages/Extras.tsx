import React, { useState } from 'react';
import { useData } from '@/src/contexts/DataContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Extras() {
  const { extras, refreshExtras, loading } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    ExtraId: '',
    ExtraName: '',
    ExtraPrice: 0,
    ExtraType: 'Per Piece',
    ExtraStatus: 'Available'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put('/extras', formData);
        toast.success('Extra updated successfully');
      } else {
        await api.post('/extras', formData);
        toast.success('Extra added successfully');
      }
      setIsDialogOpen(false);
      refreshExtras();
    } catch (error) {
      console.error('Failed to save extra', error);
      toast.error('Failed to save extra');
    }
  };

  const openEdit = (extra: any) => {
    setFormData({
      ExtraId: extra.ExtraId,
      ExtraName: extra.ExtraName,
      ExtraPrice: extra.ExtraPrice,
      ExtraType: extra.ExtraType,
      ExtraStatus: extra.ExtraStatus
    });
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setFormData({
      ExtraId: '',
      ExtraName: '',
      ExtraPrice: 0,
      ExtraType: 'Per Piece',
      ExtraStatus: 'Available'
    });
    setIsEdit(false);
    setIsDialogOpen(true);
  };

  const deleteExtra = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extra?')) return;
    try {
      await api.delete(`/extras?ExtraId=${id}`);
      toast.success('Extra deleted successfully');
      refreshExtras();
    } catch (error) {
      console.error('Failed to delete extra', error);
      toast.error('Failed to delete extra');
    }
  };

  const filteredExtras = extras.filter(extra => 
    extra.ExtraName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Extras Management</h1>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Extra
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Search extras..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extras List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Loading...</TableCell>
                </TableRow>
              ) : filteredExtras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No extras found.</TableCell>
                </TableRow>
              ) : (
                filteredExtras.map((extra) => (
                  <TableRow key={extra.ExtraId}>
                    <TableCell className="font-medium">{extra.ExtraName}</TableCell>
                    <TableCell>₱{Number(extra.ExtraPrice).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{extra.ExtraType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={extra.ExtraStatus === 'Available' ? 'default' : 'secondary'}>
                        {extra.ExtraStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(extra)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteExtra(extra.ExtraId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Extra' : 'Add New Extra'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Extra Name</Label>
              <Input 
                id="name"
                value={formData.ExtraName} 
                onChange={e => setFormData({...formData, ExtraName: e.target.value})} 
                placeholder="e.g. Perfume, Car with Carrier"
                required 
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="price">Price (₱)</Label>
                <Input 
                  id="price"
                  type="number" 
                  value={formData.ExtraPrice} 
                  onChange={e => setFormData({...formData, ExtraPrice: parseFloat(e.target.value) || 0})} 
                  required 
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.ExtraType} 
                  onValueChange={(val) => setFormData({...formData, ExtraType: val})}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per Piece">Per Piece (Multiple allowed)</SelectItem>
                    <SelectItem value="Per Vehicle">Per Vehicle (Only one allowed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.ExtraStatus} 
                onValueChange={(val) => setFormData({...formData, ExtraStatus: val})}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Extra</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
