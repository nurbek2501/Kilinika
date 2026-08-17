'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DashboardStats, FinancialReport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, Users, DollarSign, CreditCard, Activity,
  Stethoscope, Zap, Droplet, Building2, Wallet, Download, Wallet2,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

const utilityLabels: Record<string, string> = {
  ELECTRICITY: 'Elektr',
  WATER_GAS: 'Suv / Gaz',
  INTERNET: 'Internet',
  RENT: 'Ijara',
  OTHER: 'Boshqa',
};

function downloadReportCsv(report: FinancialReport) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines: string[] = [];
  lines.push('KDC Moliyaviy hisobot');
  lines.push(`Sana,${esc(new Date(report.generatedAt).toLocaleString('uz-UZ'))}`);
  lines.push('');
  lines.push('Ko\'rsatkich,Summa');
  lines.push(`Oylik tushum,${report.income}`);
  lines.push(`Oylik xarajat,${report.expenses}`);
  lines.push(`Foyda,${report.profit}`);
  lines.push(`Umumiy qarzdorlik,${report.outstandingDebt}`);
  lines.push('');
  lines.push('Mulkdorlar,Lavozim,Ulush %,Kapital');
  report.owners.forEach((o) => lines.push([esc(o.name), esc(o.title), o.ownershipPct, o.capitalBalance].join(',')));
  lines.push('');
  lines.push('Shifokor,Mutaxassislik,Tushum,Maosh');
  report.doctors.forEach((d) => lines.push([esc(d.name), esc(d.specialty), d.revenue, d.salary].join(',')));

  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kdc-hisobot-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DirectorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/director/dashboard')
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(() => toast.error('Dashboard yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/director/report');
      if (data.success) {
        downloadReportCsv(data.data);
        toast.success('Hisobot yuklab olindi');
      }
    } catch {
      toast.error('Hisobotni yuklab bo\'lmadi');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { title: 'Bugungi daromad', value: formatMoney(stats.revenue.today), icon: DollarSign, gradient: 'from-sky-500 to-sky-600', glow: 'shadow-sky-500/30' },
    { title: 'Oylik daromad', value: formatMoney(stats.revenue.monthly), icon: TrendingUp, gradient: 'from-blue-500 to-sky-600', glow: 'shadow-blue-500/30' },
    { title: 'Yillik daromad', value: formatMoney(stats.revenue.yearly), icon: Activity, gradient: 'from-sky-500 to-sky-600', glow: 'shadow-sky-500/30' },
    { title: 'Bugungi xarajat', value: formatMoney(stats.expenses.today), icon: TrendingDown, gradient: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/30' },
    { title: 'Oylik foyda', value: formatMoney(stats.profit.monthly), icon: DollarSign, gradient: stats.profit.monthly >= 0 ? 'from-sky-500 to-sky-600' : 'from-rose-500 to-red-600', glow: stats.profit.monthly >= 0 ? 'shadow-sky-500/30' : 'shadow-rose-500/30' },
    { title: 'Jami bemorlar', value: stats.patients.total.toString(), icon: Users, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30' },
    { title: 'Bugungi bemorlar', value: stats.patients.today.toString(), icon: Users, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
    { title: 'Jami qarz', value: formatMoney(stats.totalDebt), icon: CreditCard, gradient: 'from-red-500 to-rose-600', glow: 'shadow-red-500/30' },
  ];

  const budgetPct = Math.min(stats.budget.percentUsed, 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Klinika umumiy ko&apos;rsatkichlari</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Tayyorlanmoqda...' : 'Hisobotni eksport qilish'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="group relative rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50 p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className={`pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-xl font-extrabold tracking-tight">{card.value}</p>
              </div>
              <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.glow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${card.gradient} transition-all duration-500`} />
          </div>
        ))}
      </div>

      {/* Budget, utilities & capital */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget usage */}
        <Card className="border-none shadow-md">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Oylik byudjet</p>
              <Wallet2 className="h-5 w-5 text-primary" />
            </div>
            {stats.budget.monthly > 0 ? (
              <>
                <p className="text-xl font-bold">{formatMoney(stats.budget.used)}</p>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-sky-500'}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Byudjetning {stats.budget.percentUsed}% ishlatildi ({formatMoney(stats.budget.monthly)} dan)
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Byudjet o&apos;rnatilmagan. Sozlamalardan kiriting.</p>
            )}
          </CardContent>
        </Card>

        {/* Utilities */}
        <Card className="border-none shadow-md">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kommunal to&apos;lovlar (oylik)</p>
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xl font-bold">{formatMoney(stats.utilities.total)}</p>
            <div className="space-y-1.5">
              {Object.entries(stats.utilities.byCategory).length === 0 ? (
                <p className="text-xs text-muted-foreground">Bu oy kommunal to&apos;lov yo&apos;q</p>
              ) : (
                Object.entries(stats.utilities.byCategory).map(([cat, amt]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {cat === 'WATER_GAS' ? <Droplet className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                      {utilityLabels[cat] || cat}
                    </span>
                    <span className="font-medium">{formatMoney(amt)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capital / owners equity */}
        <Card className="border-none shadow-md">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mulkdorlar ulushi</p>
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold">{formatMoney(stats.equity.total)}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{stats.equity.ownersCount} ta egasi</span>
              <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" />{stats.equity.totalOwnershipPct}% taqsimlangan</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Xodimlar boshqaruvi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.doctors.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{doc.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.specialty ? `${doc.specialty} · ` : ''}{doc.patientCount} ta bemor
                      {doc.username ? ` · ${doc.username}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground uppercase">Tushum</p>
                    <Badge variant="secondary" className="text-sm font-semibold">{formatMoney(doc.totalRevenue)}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground uppercase">Maosh ({Math.round(stats.commissionRate * 100)}%)</p>
                    <Badge className="text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none">
                      {formatMoney(doc.salary)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {stats.doctors.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Hali shifokorlar qo&apos;shilmagan</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
