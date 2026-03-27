import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isToday } from 'date-fns';
import { useData } from '@/src/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Car, Receipt, Activity, Clock, UserMinus, PlusCircle, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const { employees, activeEmployees, customers, transactions, billings } = useData();
  const [stats, setStats] = useState({
    employees: 0,
    activeEmployees: 0,
    absentEmployees: 0,
    customers: 0,
    transactions: 0,
    transactionsToday: 0,
    revenue: 0,
    revenueToday: 0,
  });

  useEffect(() => {
    const totalRevenue = billings.reduce((acc: number, curr: any) => acc + (curr.BalancePaid || 0), 0);
    const revenueToday = billings.reduce((acc: number, curr: any) => {
      if (curr.DateUpdated && isToday(new Date(curr.DateUpdated))) {
        return acc + (curr.BalancePaid || 0);
      }
      return acc;
    }, 0);

    const transactionsToday = transactions.filter((t: any) => t.DateUpdated && isToday(new Date(t.DateUpdated))).length;

    setStats({
      employees: employees.length,
      activeEmployees: activeEmployees.length,
      absentEmployees: Math.max(0, employees.length - activeEmployees.length),
      customers: customers.length,
      transactions: transactions.length,
      transactionsToday,
      revenue: totalRevenue,
      revenueToday,
    });
  }, [employees, activeEmployees, customers, transactions, billings]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Revenue Today</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">₱{stats.revenueToday.toLocaleString()}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">From today's paid transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Transactions Today</CardTitle>
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.transactionsToday}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Recorded today</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Present / Timed In</CardTitle>
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.activeEmployees}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">Currently working</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Absent Employees</CardTitle>
            <UserMinus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.absentEmployees}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">Not timed in today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₱{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.transactions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.employees}</div>
            <p className="text-xs text-muted-foreground">Registered staff</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/transactions" className="group flex flex-col items-center justify-center gap-3 p-6 bg-card hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl border border-border hover:border-primary/20 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <PlusCircle className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base">New Transaction</span>
          </Link>
          <Link to="/customers" className="group flex flex-col items-center justify-center gap-3 p-6 bg-card hover:bg-purple-500/5 text-muted-foreground hover:text-purple-600 rounded-xl border border-border hover:border-purple-500/20 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-full group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Car className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base">Add Customer</span>
          </Link>
          <Link to="/billing" className="group flex flex-col items-center justify-center gap-3 p-6 bg-card hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-600 rounded-xl border border-border hover:border-emerald-500/20 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <CreditCard className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base">Process Payment</span>
          </Link>
          <Link to="/employees" className="group flex flex-col items-center justify-center gap-3 p-6 bg-card hover:bg-orange-500/5 text-muted-foreground hover:text-orange-600 rounded-xl border border-border hover:border-orange-500/20 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-orange-500/10 text-orange-600 rounded-full group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all">
              <Clock className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base text-center">Employee Time In/Out</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
