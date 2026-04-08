import { useState } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function Activity() {
  const { activities, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('luxowash_user') || '{}');

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view activity logs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredActivities = activities.filter(a => {
    const message = (a.ActivityMessage || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return message.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Activity Log</h1>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search activity..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Interactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((a, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {a.ActivityDate ? format(new Date(a.ActivityDate), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{a.ActivityMessage}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-center text-muted-foreground py-8">No activity recorded yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
