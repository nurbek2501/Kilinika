'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout allowedRoles={['DIRECTOR']}>{children}</DashboardLayout>;
}
