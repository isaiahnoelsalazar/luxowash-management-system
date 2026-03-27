import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { DataProvider } from '@/src/contexts/DataContext';
import { ThemeProvider } from '@/src/contexts/ThemeContext';
import Login from '@/src/pages/Login';
import Dashboard from '@/src/pages/Dashboard';
import Employees from '@/src/pages/Employees';
import Customers from '@/src/pages/Customers';
import Users from '@/src/pages/Users';
import Transactions from '@/src/pages/Transactions';
import Billing from '@/src/pages/Billing';
import Reports from '@/src/pages/Reports';
import Activity from '@/src/pages/Activity';
import Services from '@/src/pages/Services';
import Packages from '@/src/pages/Packages';
import Settings from '@/src/pages/Settings';
import EmployeeLogs from '@/src/pages/EmployeeLogs';

function App() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('luxowash_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <ThemeProvider>
      {!user ? (
        <Login onLogin={(u) => {
          setUser(u);
          localStorage.setItem('luxowash_user', JSON.stringify(u));
        }} />
      ) : (
        <DataProvider>
          <Router>
            <Layout user={user} onLogout={() => {
              setUser(null);
              localStorage.removeItem('luxowash_user');
            }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employee-logs" element={<EmployeeLogs />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/users" element={<Users />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/services" element={<Services />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </DataProvider>
      )}
    </ThemeProvider>
  );
}

export default App;
