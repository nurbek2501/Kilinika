'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2, CreditCard, TrendingUp, Users, Wallet, Activity, Target,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

interface AdminDash {
  totalEquity: number;
  activeDebt: { amount: number; count: number };
  todayVolume: number;
  monthlyIncome: number;
  patients: { total: number; today: number };
  forecast: { quarterlyTarget: number; realized: number; realizedPct: number; projectedDebtRecovery: number };
}

export default function AdminDashboardPage() {
  const [d, setD] = useState<AdminDash | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => { if (data.success) setD(data.data); })
      .catch(() => toast.error('Dashboard yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="p-6 h-28" /></Card>
        ))}
      </div>
    );
  }
  if (!d) return null;

  const cards = [
    { title: 'Jami kapital', value: formatMoney(d.totalEquity), icon: Building2, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
    { title: 'Faol qarz', value: `${formatMoney(d.activeDebt.amount)}`, sub: `${d.activeDebt.count} ta bemor`, icon: CreditCard, gradient: 'from-red-500 to-rose-600', glow: 'shadow-red-500/30' },
    { title: 'Bugungi tushum', value: formatMoney(d.todayVolume), icon: TrendingUp, gradient: 'from-sky-500 to-sky-600', glow: 'shadow-sky-500/30' },
    { title: 'Oylik tushum', value: formatMoney(d.monthlyIncome), icon: Activity, gradient: 'from-blue-500 to-sky-600', glow: 'shadow-blue-500/30' },
    { title: 'Jami bemorlar', value: d.patients.total.toString(), icon: Users, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30' },
    { title: 'Bugungi bemorlar', value: d.patients.today.toString(), icon: Users, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
  ];

  const realizedPct = Math.min(d.forecast.realizedPct, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Moliyaviy umumiy ko&apos;rinish</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="group relative rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50 p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className={`pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-xl font-extrabold tracking-tight">{card.value}</p>
                {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
              </div>
              <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.glow} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${card.gradient} transition-all duration-500`} />
          </div>
        ))}
      </div>

      {/* Revenue forecast */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Daromad prognozi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Kvartal maqsad</p>
              <p className="text-lg font-bold">{formatMoney(d.forecast.quarterlyTarget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Erishilgan daromad</p>
              <p className="text-lg font-bold text-emerald-600">{d.forecast.realizedPct}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Qarz undirish (proyeksiya)</p>
              <p className="text-lg font-bold text-amber-600">{formatMoney(d.forecast.projectedDebtRecovery)}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{formatMoney(d.forecast.realized)}</span>
              <span>{formatMoney(d.forecast.quarterlyTarget)}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all" style={{ width: `${realizedPct}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
