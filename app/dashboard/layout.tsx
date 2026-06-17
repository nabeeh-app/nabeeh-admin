'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, CreditCard, Brain, HeartPulse, Ticket, ShieldCheck, LogOut, Menu, X } from 'lucide-react';

interface AdminInfo {
  id: string;
  role: string;
  name: string;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/teachers', label: 'Teachers', icon: Users },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/ai-usage', label: 'AI Usage', icon: Brain },
  { href: '/dashboard/health', label: 'Health', icon: HeartPulse },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/audit-log', label: 'Audit Log', icon: ShieldCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Not authenticated');
        setAdmin(data.data);
        setMounted(true);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) return words[0].charAt(0) + words[1].charAt(0);
    return words[0]?.charAt(0) || 'A';
  };

  const roleName = admin?.role?.replace('_', ' ') || '\u00A0';
  const adminName = admin?.name || '\u00A0';

  const sidebarContent = (
    <div
      className="flex h-full w-64 flex-col"
      style={{ backgroundColor: 'var(--ink)', borderRight: '1px solid var(--primary)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--primary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 200 240" fill="none" className="w-8 h-10">
              <path d="M100 0C44.8 0 0 44.8 0 100v40c0 55.2 44.8 100 100 100s100-44.8 100-100v-40C200 44.8 155.2 0 100 0z" fill="#e5ff97" />
              <circle cx="70" cy="90" r="15" fill="#083d44" />
              <circle cx="130" cy="90" r="15" fill="#083d44" />
              <path d="M60 140c0 0 20 30 40 30s40-30 40-30" stroke="#083d44" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-lg font-bold font-display" style={{ color: 'var(--canvas)' }}>Nabeeh</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard' || pathname.endsWith('/dashboard')
            : pathname.includes(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 mx-1 text-sm font-body uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: isActive ? 'rgba(229,255,151,0.2)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'color-mix(in srgb, var(--canvas) 70%, transparent)',
              }}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4" style={{ borderTop: '1px solid var(--primary)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="h-9 w-9 flex items-center justify-center text-xs font-body"
            style={{ backgroundColor: 'rgba(229,255,151,0.1)', color: 'var(--accent)' }}
          >
            {admin?.name ? getInitials(admin.name) : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate font-body" style={{ color: 'var(--canvas)' }}>{adminName}</p>
            <p className="text-xs truncate font-body capitalize" style={{ color: 'var(--accent)' }}>{roleName}</p>
          </div>
        </div>
        {mounted && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 transition-colors font-body"
            style={{ color: 'color-mix(in srgb, var(--canvas) 70%, transparent)' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--canvas)' }}>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-3"
        style={{ backgroundColor: 'var(--ink)', color: 'var(--canvas)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">{sidebarContent}</div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 md:hidden transform transition-transform duration-200 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
