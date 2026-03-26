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
      if (curr.DateCreated && isToday(new Date(curr.DateCreated))) {
        return acc + (curr.BalancePaid || 0);
      }
      return acc;
    }, 0);

    const transactionsToday = transactions.filter((t: any) => t.DateCreated && isToday(new Date(t.DateCreated))).length;

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
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Revenue Today</CardTitle>
            <Receipt className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">₱{stats.revenueToday.toLocaleString()}</div>
            <p className="text-xs text-blue-600">From today's paid transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Transactions Today</CardTitle>
            <Activity className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.transactionsToday}</div>
            <p className="text-xs text-green-600">Recorded today</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Present / Timed In</CardTitle>
            <Clock className="h-4 w-4 text-purple-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.activeEmployees}</div>
            <p className="text-xs text-purple-600">Currently working</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Absent Employees</CardTitle>
            <UserMinus className="h-4 w-4 text-orange-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.absentEmployees}</div>
            <p className="text-xs text-orange-600">Not timed in today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Customers</CardTitle>
            <Car className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-gray-500">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees}</div>
            <p className="text-xs text-gray-500">Registered staff</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/transactions" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl border border-gray-200 hover:border-blue-200 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <PlusCircle className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base">New Transaction</span>
          </Link>
          <Link to="/customers" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-xl border border-gray-200 hover:border-purple-200 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Car className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base">Add Customer</span>
          </Link>
          <Link to="/billing" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <CreditCard className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base">Process Payment</span>
          </Link>
          <Link to="/employees" className="group flex flex-col items-center justify-center gap-3 p-6 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 rounded-xl border border-gray-200 hover:border-orange-200 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all">
              <Clock className="h-6 w-6" />
            </div>
            <span className="font-medium text-sm lg:text-base text-center">Employee Time In/Out</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
