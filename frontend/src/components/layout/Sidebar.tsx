'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import {
  LayoutDashboard, Users, CreditCard, Settings, CalendarCheck,
  UserPlus, Search, Stethoscope, X, Settings2, Building2
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems: Record<string, Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }>> = {
  DIRECTOR: [
    { label: 'Dashboard', href: '/director', icon: LayoutDashboard },
    { label: 'Foydalanuvchilar', href: '/director/users', icon: Users },
    { label: 'Qarzdorlar', href: '/director/debtors', icon: CreditCard },
    { label: 'Mulkdorlar', href: '/director/owners', icon: Building2 },
    { label: 'Xizmatlar', href: '/director/services', icon: Settings },
    { label: 'Xarajatlar', href: '/director/expenses', icon: CreditCard },
    { label: 'Sozlamalar', href: '/director/settings', icon: Settings2 },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bemor qo\'shish', href: '/admin', icon: UserPlus },
    { label: 'Bemorlar', href: '/admin/patients', icon: Search },
    { label: 'Navbat', href: '/admin/schedules', icon: CalendarCheck },
    { label: 'Qarzdorlar', href: '/admin/debtors', icon: CreditCard },
    { label: 'Mulkdorlar', href: '/admin/owners', icon: Building2 },
    { label: 'Shifokorlar', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Sozlamalar', href: '/admin/settings', icon: Settings2 },
  ],
  DOCTOR: [
    { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
    { label: 'Navbat', href: '/doctor/appointments', icon: CalendarCheck },
    { label: 'Bemor qo\'shish', href: '/doctor/register', icon: UserPlus },
    { label: 'Bemorlarim', href: '/doctor/patients', icon: Users },
    { label: 'Qarzdorlar', href: '/doctor/debtors', icon: CreditCard },
    { label: 'Mulkdorlar', href: '/doctor/owners', icon: Building2 },
  ],
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const items = user ? menuItems[user.role] || [] : [];

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card/95 backdrop-blur-xl border-r border-border/60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto overflow-hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* soft brand glow at the top */}
        <div className="pointer-events-none absolute -top-24 -left-10 w-64 h-48 bg-sky-400/15 dark:bg-sky-400/10 blur-3xl rounded-full" />

        <div className="relative flex items-center justify-between p-4 border-b border-border/60">
          <Logo />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="relative flex-1 overflow-y-auto p-3 space-y-1.5">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden',
                  isActive
                    ? 'text-white shadow-lg shadow-sky-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/70 hover:translate-x-1'
                )}
              >
                {/* active gradient fill */}
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-r from-sky-500 to-sky-600" />
                )}
                {/* active left indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white/90" />
                )}
                <span className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors',
                  isActive ? 'bg-white/15' : 'bg-muted/60 group-hover:bg-sky-500/10 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                )}>
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative p-3 border-t border-border/60">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
