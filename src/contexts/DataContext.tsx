import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '@/lib/api';

interface DataContextType {
  transactions: any[];
  billings: any[];
  employees: any[];
  activeEmployees: any[];
  todayLogs: any[];
  vehicles: any[];
  customers: any[];
  services: any[];
  packages: any[];
  activities: any[];
  users: any[];
  loading: boolean;
  refreshTransactions: () => Promise<void>;
  refreshBillings: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  refreshActiveEmployees: () => Promise<void>;
  refreshTodayLogs: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshPackages: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTransactions = async () => { const res = await api.get('/transactions'); setTransactions(res); };
  const refreshBillings = async () => { const res = await api.get('/billing'); setBillings(res); };
  const refreshEmployees = async () => { const res = await api.get('/employees'); setEmployees(res); };
  const refreshActiveEmployees = async () => { const res = await api.get('/employees/time/active'); setActiveEmployees(res); };
  const refreshTodayLogs = async () => {
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    const res = await api.get(`/employees/time/logs?date=${dateStr}`);
    setTodayLogs(res);
  };
  const refreshVehicles = async () => { const res = await api.get('/vehicles'); setVehicles(res); };
  const refreshCustomers = async () => { const res = await api.get('/customers'); setCustomers(res); };
  const refreshServices = async () => { const res = await api.get('/services'); setServices(res); };
  const refreshPackages = async () => { const res = await api.get('/packages'); setPackages(res); };
  const refreshActivities = async () => { const res = await api.get('/activity'); setActivities(res.reverse()); };
  const refreshUsers = async () => { const res = await api.get('/users'); setUsers(res); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshTransactions(),
        refreshBillings(),
        refreshEmployees(),
        refreshActiveEmployees(),
        refreshTodayLogs(),
        refreshVehicles(),
        refreshCustomers(),
        refreshServices(),
        refreshPackages(),
        refreshActivities(),
        refreshUsers(),
      ]);
    } catch (error) {
      console.error('Failed to fetch initial data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <DataContext.Provider value={{
      transactions, billings, employees, activeEmployees, todayLogs, vehicles, customers, services, packages, activities, users, loading,
      refreshTransactions, refreshBillings, refreshEmployees, refreshActiveEmployees, refreshTodayLogs, refreshVehicles, refreshCustomers, refreshServices, refreshPackages, refreshActivities, refreshUsers, fetchAll
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
