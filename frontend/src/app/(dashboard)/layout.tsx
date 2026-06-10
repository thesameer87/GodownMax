'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Users,
  TrendingUp, Bell, Settings, LogOut, Menu, X, Moon, Sun,
  Truck, UserCheck, ClipboardList, Brain, BarChart3, ChevronDown,
  Package2, Tag, Activity, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Inventory', icon: Package, children: [
      { href: '/dashboard/products', label: 'Products', icon: Package2 },
      { href: '/dashboard/inventory', label: 'Stock Levels', icon: Warehouse },
      { href: '/dashboard/categories', label: 'Categories', icon: Tag },
    ]
  },
  {
    label: 'Orders', icon: ShoppingCart, children: [
      { href: '/dashboard/orders', label: 'All Orders', icon: ClipboardList },
      { href: '/dashboard/suppliers', label: 'Suppliers', icon: Truck },
      { href: '/dashboard/customers', label: 'Customers', icon: UserCheck },
    ]
  },
  { href: '/dashboard/warehouses', label: 'Warehouses', icon: Warehouse },
  { href: '/dashboard/ai', label: 'AI Assistant', icon: Brain },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/activities', label: 'Activity Log', icon: Activity },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function NavItem({ item, pathname, collapsed }: any) {
  const [open, setOpen] = useState(false);

  if (item.children) {
    const isActive = item.children.some((c: any) => pathname.startsWith(c.href));
    return (
      <div>
        <button onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}>
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
            </>
          )}
        </button>
        {!collapsed && open && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.children.map((child: any) => (
              <Link key={child.href} href={child.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                  pathname === child.href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}>
                <child.icon className="w-3.5 h-3.5" />
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = pathname === item.href;
  return (
    <Link href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}>
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && item.label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:relative z-50 h-full flex flex-col border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="GodownMax Logo" className="w-6 h-6 object-contain" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-bold text-sm">GodownMax</span>
              <p className="text-xs text-muted-foreground">Enterprise Edition</p>
            </div>
          )}
          <button className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 rounded-lg hover:bg-accent"
            onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.label} item={item} pathname={pathname} collapsed={!sidebarOpen} />
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t z-10 relative bg-card">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center py-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 relative z-50">
          <button className="lg:hidden" onClick={() => setMobileSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-lg hover:bg-accent flex items-center justify-center transition">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
            {user?.name?.charAt(0)}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-background/50 relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.7] z-0 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="" className="w-full max-w-[80%] max-h-[80%] object-contain" />
          </div>
          <div className="p-6 relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
