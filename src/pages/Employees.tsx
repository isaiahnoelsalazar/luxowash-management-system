import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Employees() {
  const { employees, activeEmployees, loading, refreshEmployees, refreshActiveEmployees } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    EmployeeId: '', LastName: '', FirstName: '', MiddleName: '', MobileNumber: '', EmployeeAddress: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.EmployeeId) {
        await api.put('/employees', formData);
      } else {
        await api.post('/employees', formData);
      }
      setIsDialogOpen(false);
      refreshEmployees();
    } catch (error) {
      console.error('Failed to save employee', error);
    }
  };

  const handleTimeAction = async (empId: string, action: 'in' | 'out') => {
    try {
      await api.post('/employees/time', { EmployeeId: empId, action });
      refreshActiveEmployees();
    } catch (error) {
      console.error('Failed to record time', error);
    }
  };

  const openEdit = (emp: any) => {
    setFormData(emp);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setFormData({ EmployeeId: '', LastName: '', FirstName: '', MiddleName: '', MobileNumber: '', EmployeeAddress: '' });
    setIsDialogOpen(true);
  };

  const filteredEmployees = employees.filter(emp => {
    const name = `${emp.FirstName} ${emp.LastName}`.toLowerCase();
    const contact = (emp.MobileNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || contact.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employees</h1>
        <Button onClick={openAdd} className="w-full sm:w-auto">Add Employee</Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search employees..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{formData.EmployeeId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.FirstName} onChange={e => setFormData({...formData, FirstName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.LastName} onChange={e => setFormData({...formData, LastName: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input value={formData.MiddleName || ''} onChange={e => setFormData({...formData, MiddleName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={formData.MobileNumber || ''} onChange={e => setFormData({...formData, MobileNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.EmployeeAddress || ''} onChange={e => setFormData({...formData, EmployeeAddress: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Employee List & Time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const isActive = activeEmployees.some(a => a.EmployeeId === emp.EmployeeId);
                return (
                  <TableRow key={emp.EmployeeId}>
                    <TableCell className="font-medium">{emp.FirstName} {emp.LastName}</TableCell>
                    <TableCell>{emp.MobileNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {isActive ? 'Timed In' : 'Timed Out'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" onClick={() => openEdit(emp)}>Edit</Button>
                      {isActive ? (
                        <Button variant="destructive" size="sm" onClick={() => handleTimeAction(emp.EmployeeId, 'out')}>Time Out</Button>
                      ) : (
                        <Button variant="default" size="sm" onClick={() => handleTimeAction(emp.EmployeeId, 'in')}>Time In</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
