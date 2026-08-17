'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/stores/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!allowedRoles.includes(user.role)) {
        const redirectMap: Record<string, string> = {
          DIRECTOR: '/director',
          ADMIN: '/admin',
          DOCTOR: '/doctor',
        };
        router.push(redirectMap[user.role] || '/login');
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-sky-500/10" />
          </div>
          <p className="mono text-xs tracking-[0.25em] text-muted-foreground uppercase">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* ambient animated background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[32rem] h-[32rem] rounded-full bg-sky-400/10 dark:bg-sky-400/[0.07] blur-3xl animate-morph" />
        <div className="absolute -bottom-48 left-1/3 w-[34rem] h-[34rem] rounded-full bg-sky-400/8 dark:bg-sky-400/[0.05] blur-3xl animate-morph" style={{ animationDelay: '5s' }} />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
