import { useState } from 'react';
import { api } from '@/lib/api';
import { useData } from '@/src/contexts/DataContext';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Activity() {
  const { activities, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');

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
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((a, index) => (
                  <TableRow key={index}>
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
