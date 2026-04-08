import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Car, UserCircle, Receipt, FileText, Activity as ActivityIcon, LogOut, CreditCard, Wrench, Package, Menu, Settings, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import logo from "../src/luxowash_logo.jpg";

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Employee Logs', href: '/employee-logs', icon: Clock },
  { name: 'Customers & Vehicles', href: '/customers', icon: Car },
  { name: 'Services', href: '/services', icon: Wrench },
  { name: 'Packages', href: '/packages', icon: Package },
  { name: 'Extras', href: '/extras', icon: Sparkles },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Activity Log', href: '/activity', icon: ActivityIcon },
  { name: 'User Accounts', href: '/users', icon: UserCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout({ children, user, onLogout }: { children: React.ReactNode; user: any; onLogout: () => void }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    if (user.role !== 'admin') {
      if (['Reports', 'Activity Log'].includes(item.name)) return false;
    }
    return true;
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="border-b border-border">
        <img src={logo} alt="Luxowash Logo" className="w-100" />
        {/* <h1 className="text-2xl font-bold text-primary">Luxowash</h1>
        <p className="text-sm text-muted-foreground">POS & Management</p> */}
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" id="sidebar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className={cn('mr-3 h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 border-r border-border flex-col">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold text-primary">Luxowash</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
