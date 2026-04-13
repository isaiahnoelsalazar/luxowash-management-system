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
import { Badge } from '@/components/ui/badge';

export default function Users() {
  const { users, loading, refreshUsers } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ Username: '', Password: '', DailyRate: 0, ScheduleTime: '', Role: 'user' });
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('luxowash_user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime && endTime && startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }
    
    const schedule = (startTime && endTime) ? `${startTime} - ${endTime}` : '';
    const dataToSubmit = { ...formData, ScheduleTime: schedule };

    try {
      if (isEdit) {
        await api.put('/users', dataToSubmit);
      } else {
        await api.post('/users', dataToSubmit);
      }
      setIsDialogOpen(false);
      refreshUsers();
    } catch (error) {
      console.error('Failed to save user', error);
    }
  };

  const openEdit = (user: any) => {
    let st = '';
    let et = '';
    if (user.ScheduleTime && user.ScheduleTime.includes(' - ')) {
      [st, et] = user.ScheduleTime.split(' - ');
    }
    setStartTime(st);
    setEndTime(et);
    setFormData({ Username: user.Username, Password: '', DailyRate: user.DailyRate || 0, ScheduleTime: user.ScheduleTime || '', Role: user.Role || 'user' });
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setStartTime('');
    setEndTime('');
    setFormData({ Username: '', Password: '', DailyRate: 0, ScheduleTime: '', Role: 'user' });
    setIsEdit(false);
    setIsDialogOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const username = (u.Username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return username.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">User Accounts</h1>
        {isAdmin && <Button onClick={openAdd}>Add User</Button>}
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search users..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit User Password' : 'Add User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input 
                  value={formData.Username} 
                  onChange={e => setFormData({...formData, Username: e.target.value})} 
                  required 
                  disabled={isEdit} 
                  minLength={3}
                  maxLength={50}
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Username must be alphanumeric and can contain underscores."
                />
              </div>
              <div className="space-y-2">
                <Label>Password {isEdit && '(Leave blank to keep current)'}</Label>
                <Input 
                  type="password" 
                  value={formData.Password} 
                  onChange={e => setFormData({...formData, Password: e.target.value})} 
                  required={!isEdit} 
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={formData.Role} 
                  onValueChange={(val) => setFormData({...formData, Role: val})}
                  disabled={isEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.Role === 'user' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Rate (₱)</Label>
                    <Input 
                      type="number" 
                      value={formData.DailyRate} 
                      onChange={e => setFormData({...formData, DailyRate: Number(e.target.value)})} 
                      required 
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Schedule Time</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="time" 
                        value={startTime} 
                        onChange={e => setStartTime(e.target.value)} 
                        required
                      />
                      <span>-</span>
                      <Input 
                        type="time" 
                        value={endTime} 
                        onChange={e => setEndTime(e.target.value)} 
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Login</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.Username}>
                  <TableCell className="font-medium">{u.Username}</TableCell>
                  <TableCell>
                    <Badge variant={u.Role === 'admin' ? 'default' : 'secondary'}>
                      {u.Role ? u.Role.charAt(0).toUpperCase() + u.Role.slice(1) : 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.Role === 'admin' ? 'N/A' : `₱${Number(u.DailyRate || 0).toLocaleString()}`}</TableCell>
                  <TableCell>{u.Role === 'admin' ? 'N/A' : (u.ScheduleTime || 'N/A')}</TableCell>
                  <TableCell>{u.LastLogin || 'Never'}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => openEdit(u)}>Edit</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
