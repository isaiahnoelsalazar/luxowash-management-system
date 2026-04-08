import React, { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Employees() {
  const { employees, activeEmployees, todayLogs, loading, refreshEmployees, refreshActiveEmployees, refreshTodayLogs } = useData();
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
      toast.success(`Successfully timed ${action === 'in' ? 'in' : 'out'}`);
      refreshActiveEmployees();
      refreshTodayLogs();
    } catch (error: any) {
      const message = error.message || 'Failed to record time';
      toast.error(message);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Employees</h1>
        <Button onClick={openAdd}>Add Employee</Button>
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{formData.EmployeeId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.FirstName} onChange={e => setFormData({...formData, FirstName: e.target.value})} required minLength={2} maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.LastName} onChange={e => setFormData({...formData, LastName: e.target.value})} required minLength={2} maxLength={50} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input value={formData.MiddleName || ''} onChange={e => setFormData({...formData, MiddleName: e.target.value})} maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={formData.MobileNumber || ''} onChange={e => setFormData({...formData, MobileNumber: e.target.value})} pattern="[0-9+\-\s()]+" title="Only numbers, spaces, and + - ( ) are allowed" maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.EmployeeAddress || ''} onChange={e => setFormData({...formData, EmployeeAddress: e.target.value})} maxLength={200} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Employee List & Time Tracking</CardTitle>
        </CardHeader>
        <CardContent>
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
                const hasTimedInToday = todayLogs.some(l => l.EmployeeId === emp.EmployeeId);
                const hasTimedOutToday = todayLogs.some(l => l.EmployeeId === emp.EmployeeId && l.TimeOut);
                
                return (
                  <TableRow key={emp.EmployeeId}>
                    <TableCell className="font-medium">{emp.FirstName} {emp.LastName}</TableCell>
                    <TableCell>{emp.MobileNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        isActive 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                          : hasTimedOutToday
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-muted text-muted-foreground"
                      )}>
                        {isActive ? 'Timed In' : hasTimedOutToday ? 'Completed' : 'Timed Out'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(emp)}>Edit</Button>
                      {isActive ? (
                        <Button variant="destructive" size="sm" onClick={() => handleTimeAction(emp.EmployeeId, 'out')}>Time Out</Button>
                      ) : !hasTimedInToday ? (
                        <Button variant="default" size="sm" onClick={() => handleTimeAction(emp.EmployeeId, 'in')}>Time In</Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>Done Today</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
