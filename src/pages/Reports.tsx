import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const processData = (period: 'daily' | 'weekly' | 'monthly') => {
    const dataMap = new Map();
    const now = new Date();

    reports.forEach(r => {
      if (!r.DateCreated) return;
      const date = parseISO(r.DateCreated);
      let key = '';

      if (period === 'daily') {
        if (isSameMonth(date, now)) {
          key = format(date, 'MMM dd');
        }
      } else if (period === 'weekly') {
        key = `Week of ${format(startOfWeek(date), 'MMM dd')}`;
      } else if (period === 'monthly') {
        key = format(date, 'MMM yyyy');
      }

      if (key) {
        dataMap.set(key, (dataMap.get(key) || 0) + (r.BalancePaid || 0));
      }
    });

    return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Reports</h1>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
