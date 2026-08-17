'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DoctorDashboard } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, DollarSign, TrendingUp, CalendarCheck,
  Percent, Stethoscope, Activity, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

export default function DoctorDashboardPage() {
  const [stats, setStats] = useState<DoctorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctor/dashboard')
      .then(({ data }) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => toast.error('Dashboard yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 bg-muted rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-72 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-none shadow-md">
              <CardContent className="p-5">
                <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-none shadow-md">
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-1/3 mb-4" />
                <div className="h-12 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Bugungi bemorlar',
      value: stats.patients.today.toString(),
      subtitle: 'nafar',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Oylik bemorlar',
      value: stats.patients.monthly.toString(),
      subtitle: 'nafar',
      icon: Activity,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      title: 'Bugungi daromad',
      value: formatMoney(stats.revenue.today),
      subtitle: '',
      icon: DollarSign,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      title: 'Oylik daromad',
      value: formatMoney(stats.revenue.monthly),
      subtitle: '',
      icon: TrendingUp,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Shifokor paneli
        </h1>
        <p className="text-muted-foreground mt-1">
          Sizning shaxsiy statistikangiz
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow duration-300 border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commission & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Commission card */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Percent className="h-5 w-5 text-amber-500" />
              Komissiya ({Math.round(stats.commissionRate * 100)}%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Bugungi komissiya</p>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">
                  {formatMoney(stats.commission.today)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/30">
              <div>
                <p className="text-sm text-sky-700 dark:text-sky-400 font-medium">Oylik komissiya</p>
                <p className="text-2xl font-bold text-sky-800 dark:text-sky-300 mt-1">
                  {formatMoney(stats.commission.monthly)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-sky-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              * Har bir bemordan {Math.round(stats.commissionRate * 100)}% komissiya hisoblanadi
            </p>
          </CardContent>
        </Card>

        {/* Pending appointments card */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
              Kutayotgan navbatlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-4">
                <Clock className="h-10 w-10 text-blue-500" />
              </div>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {stats.pendingAppointments}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                ta bemor navbatda kutmoqda
              </p>
              {stats.pendingAppointments > 0 && (
                <Badge variant="secondary" className="mt-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  <a href="/doctor/appointments" className="flex items-center gap-1">
                    Navbatlarni ko&apos;rish
                    <CalendarCheck className="h-3 w-3" />
                  </a>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
