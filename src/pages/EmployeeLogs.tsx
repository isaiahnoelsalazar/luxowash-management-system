import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmployeeLogs() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [date]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
      const res = await api.get(`/employees/time/logs?date=${dateStr}`);
      setLogs(res);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Employee Time Logs</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal bg-background text-foreground border-border",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border-border" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="bg-background text-foreground"
              />
            </PopoverContent>
          </Popover>
          <Button onClick={fetchLogs} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="w-5 h-5" />
            Records for {date ? format(date, "MMMM d, yyyy") : 'All Time'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Employee Name</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Time In</TableHead>
                <TableHead className="text-muted-foreground">Time Out</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading logs...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records found for this date.</TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => (
                  <TableRow key={idx} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {log.FirstName} {log.LastName}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {log.DateCreated.split(' ')[0]}
                    </TableCell>
                    <TableCell className="text-foreground">{log.TimeIn}</TableCell>
                    <TableCell className="text-foreground">{log.TimeOut || '---'}</TableCell>
                    <TableCell>
                      {log.TimeOut ? (
                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                          Timed In
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
