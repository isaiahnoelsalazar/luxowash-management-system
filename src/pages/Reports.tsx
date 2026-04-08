import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, isSameDay, isSameWeek, isSameMonth, isWithinInterval, endOfDay, parse } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Reports() {
  const { transactions, billings, employees, services, vehicles, users, activities, loading: dataLoading } = useData();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const currentUser = JSON.parse(localStorage.getItem('luxowash_user') || '{}');

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [salaryStartDate, setSalaryStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [salaryEndDate, setSalaryEndDate] = useState<string>(format(endOfDay(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res);
      } catch (error) {
        console.error('Failed to fetch reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const salaryData = useMemo(() => {
    if (!transactions.length || !billings.length) return { employeeSalaries: [], userASalaries: [] };

    const start = salaryStartDate ? startOfDay(parseISO(salaryStartDate)) : new Date(0);
    const end = salaryEndDate ? endOfDay(parseISO(salaryEndDate)) : new Date();

    const employeeSalaries: { [id: string]: { name: string; total: number; transactions: any[] } } = {};
    const userASalaries: { [username: string]: { total: number; details: any[] } } = {};

    // Initialize employees
    employees.forEach(emp => {
      employeeSalaries[emp.EmployeeId] = { name: `${emp.FirstName} ${emp.LastName}`, total: 0, transactions: [] };
    });

    // Initialize User A (current user)
    if (currentUser.username && currentUser.role !== 'admin') {
      userASalaries[currentUser.username] = { total: 0, details: [] };
      const userRecord = users.find(u => u.Username === currentUser.username);
      if (userRecord && userRecord.DailyRate) {
        // Calculate daily rate based on unique login days within the date range
        const loginDays = new Set<string>();
        activities.forEach(a => {
          if (a.ActivityMessage === `User ${currentUser.username} logged in.` && a.ActivityDate) {
            const activityDate = parseISO(a.ActivityDate);
            if (isWithinInterval(activityDate, { start, end })) {
              loginDays.add(format(activityDate, 'yyyy-MM-dd'));
            }
          }
        });
        
        const totalDailyRate = loginDays.size * Number(userRecord.DailyRate);
        userASalaries[currentUser.username].total += totalDailyRate;
        
        if (loginDays.size > 0) {
          userASalaries[currentUser.username].details.push({
            id: 'daily_rate',
            amount: totalDailyRate,
            reason: `Daily Rate (${loginDays.size} days @ ₱${userRecord.DailyRate})`,
            date: new Date().toISOString()
          });
        }
      }
    }

    transactions.forEach(t => {
      const billing = billings.find(b => b.BillingId === t.TransactionId);
      if (!billing || billing.BillingStatus !== 'Paid') return;

      const transactionDate = parseISO(t.DateCreated);
      if (!isWithinInterval(transactionDate, { start, end })) return;

      const vehicle = vehicles.find(v => v.VehicleId === t.VehicleId);
      const size = vehicle ? vehicle.VehicleSize : 'M';
      const sizeKey = `ServicePriceSize${size}`;

      const serviceEntries = (t.ServiceIdList || '').split(',').filter(Boolean);
      const serviceIds = serviceEntries.map(entry => entry.split(':')[0]);
      const assignedEmployeeIds = (t.EmployeeIdList || '').split(',').filter(Boolean);

      if (assignedEmployeeIds.length === 0) return;

      let totalEmployeeSalary = 0;
      let totalUserASalary = 0;

      // Special Services
      const hasDBTZ = serviceIds.some(id => id === 'S_DBTZ');
      const ucService = serviceIds.find(id => id === 'S_UC');
      const sccServices = serviceEntries.filter(entry => {
        const id = entry.split(':')[0];
        return ['S_SCCR', 'S_SCCI', 'S_SCCL', 'S_SCLR', 'S_SCLI', 'S_SCLL'].some(prefix => id === prefix);
      });

      // Calculate base transaction price (excluding special services for employee calculation if needed)
      let basePriceFor30Percent = Number(billing.TransactionBalance) || 0;

      if (hasDBTZ) {
        // S_DBTZ price goes to User A, not employees
        const dbtzEntry = serviceEntries.find(e => e.startsWith('S_DBTZ'));
        const dbtzQty = dbtzEntry?.includes(':') ? Number(dbtzEntry.split(':')[1]) : 1;
        const dbtzSrv = services.find(s => s.ServiceId === 'S_DBTZ');
        const dbtzPrice = (dbtzSrv ? (dbtzSrv[sizeKey] || 0) : 0) * dbtzQty;
        totalUserASalary += dbtzPrice;
        basePriceFor30Percent -= dbtzPrice;
      }

      if (ucService) {
        // S_UC has fixed rates
        let ucRate = 0;
        if (['S', 'M'].includes(size)) ucRate = 1000;
        else if (['L', 'XL'].includes(size)) ucRate = 1800;
        else if (size === 'XXL') ucRate = 2000;
        
        const ucEntry = serviceEntries.find(e => e.startsWith('S_UC'));
        const ucQty = ucEntry?.includes(':') ? Number(ucEntry.split(':')[1]) : 1;
        totalEmployeeSalary += ucRate * ucQty;
        
        const ucSrv = services.find(s => s.ServiceId === ucService);
        const ucPrice = (ucSrv ? (ucSrv[sizeKey] || 0) : 0) * ucQty;
        basePriceFor30Percent -= ucPrice;
      }

      if (sccServices.length > 0) {
        sccServices.forEach(sccEntry => {
          const [sccId, qtyStr] = sccEntry.split(':');
          const qty = qtyStr ? Number(qtyStr) : 1;
          const sccSrv = services.find(s => s.ServiceId === sccId);
          const sccPrice = (sccSrv ? (sccSrv[sizeKey] || 0) : 0) * qty;
          
          // 50% of service price
          totalEmployeeSalary += sccPrice * 0.5;
          basePriceFor30Percent -= sccPrice;
        });
      }

      // 30% of the remaining "whole transaction"
      totalEmployeeSalary += basePriceFor30Percent * 0.3;

      // Split among assigned employees
      const salaryPerEmployee = totalEmployeeSalary / assignedEmployeeIds.length;
      assignedEmployeeIds.forEach(empId => {
        if (employeeSalaries[empId]) {
          employeeSalaries[empId].total += salaryPerEmployee;
          employeeSalaries[empId].transactions.push({
            id: t.TransactionId,
            amount: salaryPerEmployee,
            date: t.DateCreated
          });
        }
      });

      // Add to User A if applicable
      if (totalUserASalary > 0 && currentUser.username && currentUser.role !== 'admin') {
        userASalaries[currentUser.username].total += totalUserASalary;
        userASalaries[currentUser.username].details.push({
          id: t.TransactionId,
          amount: totalUserASalary,
          reason: 'S_DBTZ Service',
          date: t.DateCreated
        });
      }
    });

    return { employeeSalaries: Object.values(employeeSalaries), userASalaries: Object.entries(userASalaries).map(([username, data]) => ({ username, ...data })) };
  }, [transactions, billings, employees, services, vehicles, users, activities, currentUser.username, currentUser.role, salaryStartDate, salaryEndDate]);

  const processData = (period: 'daily' | 'weekly' | 'monthly') => {
    const dataMap = new Map();
    const now = new Date();

    reports.forEach(r => {
      const dateStr = r.DateUpdated || r.DateCreated;
      if (!dateStr) return;
      const date = parseISO(dateStr);
      let key = '';
      let sortKey = '';

      if (period === 'daily') {
        if (isSameMonth(date, now)) {
          key = format(date, 'MMM dd');
          sortKey = format(date, 'yyyyMMdd');
        }
      } else if (period === 'weekly') {
        const start = startOfWeek(date);
        key = `Week of ${format(start, 'MMM dd')}`;
        sortKey = format(start, 'yyyyMMdd');
      } else if (period === 'monthly') {
        key = format(date, 'MMM yyyy');
        sortKey = format(date, 'yyyyMM');
      }

      if (key) {
        const current = dataMap.get(key) || { name: key, value: 0, sortKey };
        current.value += (r.BalancePaid || 0);
        dataMap.set(key, current);
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary">Sales Reports</h1>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="salary">Salary Calculation</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales (Current Month)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px] p-2 sm:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processData('daily')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px] p-2 sm:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processData('weekly')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px] p-2 sm:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processData('monthly')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="salary">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Salary Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-2 w-full sm:w-auto">
                    <Label>Start Date</Label>
                    <Input 
                      type="date" 
                      value={salaryStartDate} 
                      onChange={(e) => setSalaryStartDate(e.target.value)}
                      max={salaryEndDate}
                    />
                  </div>
                  <div className="space-y-2 w-full sm:w-auto">
                    <Label>End Date</Label>
                    <Input 
                      type="date" 
                      value={salaryEndDate} 
                      onChange={(e) => setSalaryEndDate(e.target.value)}
                      min={salaryStartDate}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employee Salary Breakdown (30% Base + Special Rates)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead className="text-right">Total Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryData.employeeSalaries?.map((emp: any) => (
                      <React.Fragment key={emp.name}>
                        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedEmployee(expandedEmployee === emp.name ? null : emp.name)}>
                          <TableCell className="font-medium flex items-center gap-2">
                            {expandedEmployee === emp.name ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {emp.name}
                          </TableCell>
                          <TableCell>{emp.transactions.length} jobs</TableCell>
                          <TableCell className="text-right font-bold text-green-600">₱{emp.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        {expandedEmployee === emp.name && (
                          <TableRow>
                            <TableCell colSpan={3} className="p-0">
                              <div className="bg-muted/30 p-4 space-y-2">
                                <p className="text-sm font-semibold">Job Details:</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="h-8 text-xs">Date</TableHead>
                                      <TableHead className="h-8 text-xs">Transaction ID</TableHead>
                                      <TableHead className="h-8 text-xs text-right">Commission</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {emp.transactions.map((t: any, i: number) => (
                                      <TableRow key={i}>
                                        <TableCell className="py-1 text-xs">{format(parseISO(t.date), 'MMM d, h:mm a')}</TableCell>
                                        <TableCell className="py-1 text-xs">{t.id.substring(0, 8)}...</TableCell>
                                        <TableCell className="py-1 text-xs text-right">₱{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {currentUser.role !== 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>My Salary ({currentUser.username})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salaryData.userASalaries?.map((user: any) => (
                      <div key={user.username} className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                          <span className="font-semibold">Total Earnings:</span>
                          <span className="text-2xl font-bold text-primary">₱{user.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.details.map((d: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell>{d.date ? format(new Date(d.date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                <TableCell>{d.reason}</TableCell>
                                <TableCell className="text-right">₱{d.amount.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                            {user.details.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No special service commissions yet.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
