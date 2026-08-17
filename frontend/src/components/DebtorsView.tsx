'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Debt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  CreditCard, Phone, AlertTriangle, Clock, Bell, CheckCircle2, Loader2, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

function getOverdueDays(deadline: string): number {
  const now = new Date();
  const dl = new Date(deadline);
  return Math.floor((now.getTime() - dl.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysUntil(deadline: string): number {
  const now = new Date();
  const dl = new Date(deadline);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeadlineBadge(deadline: string) {
  const overdue = getOverdueDays(deadline);
  const daysUntil = getDaysUntil(deadline);
  if (overdue > 0) {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-none">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {overdue} kun kechikkan
      </Badge>
    );
  }
  return (
    <Badge className={
      daysUntil <= 3
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none'
        : 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-none'
    }>
      <Clock className="h-3 w-3 mr-1" />
      {daysUntil} kun qoldi
    </Badge>
  );
}

/**
 * Shared debtors table used by the director, admin and doctor panels.
 * `apiBase` is the role prefix (e.g. "/director"). All roles can mark a debt
 * as paid, send an SMS reminder, or call the patient.
 */
export function DebtorsView({ apiBase }: { apiBase: string }) {
  const [debtors, setDebtors] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchDebtors = useCallback(() => {
    api.get(`${apiBase}/debtors`)
      .then(({ data }) => {
        if (data.success) {
          const sorted = [...data.data].sort(
            (a: Debt, b: Debt) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
          setDebtors(sorted);
        }
      })
      .catch(() => toast.error('Qarzdorlar yuklanmadi'))
      .finally(() => setLoading(false));
  }, [apiBase]);

  useEffect(() => { fetchDebtors(); }, [fetchDebtors]);

  const handlePay = async (debt: Debt) => {
    if (!confirm(`${debt.patientName} qarzini "to'landi" deb belgilaysizmi? Bu daromadga qo'shiladi.`)) return;
    setBusyId(debt.id);
    try {
      const { data } = await api.patch(`${apiBase}/debtors/${debt.id}/pay`);
      if (data.success) {
        toast.success('Qarz to\'landi deb belgilandi');
        setDebtors((prev) => prev.filter((d) => d.id !== debt.id));
      } else {
        toast.error(data.message || 'Amalda xatolik');
      }
    } catch {
      toast.error('Amalda xatolik');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemind = async (debt: Debt) => {
    setBusyId(debt.id);
    try {
      const { data } = await api.post(`${apiBase}/debtors/${debt.id}/remind`);
      if (data.success) {
        toast.success(data.data?.sent ? 'SMS eslatma yuborildi' : 'Eslatma qayd etildi (SMS sozlanmagan)');
        setDebtors((prev) => prev.map((d) => (d.id === debt.id ? { ...d, reminderSent: !!data.data?.sent } : d)));
      } else {
        toast.error(data.message || 'Eslatma yuborishda xatolik');
      }
    } catch {
      toast.error('Eslatma yuborishda xatolik');
    } finally {
      setBusyId(null);
    }
  };

  const totalDebt = debtors.reduce((sum, d) => sum + d.amount, 0);
  const overdueCount = debtors.filter((d) => getOverdueDays(d.deadline) > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Qarzdorlar</h1>
        <p className="text-muted-foreground">Qarzga davolangan bemorlar ro&apos;yxati</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jami qarz</p>
                <p className="text-xl font-bold">{formatMoney(totalDebt)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30"><CreditCard className="h-5 w-5 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Qarzdorlar soni</p>
                <p className="text-xl font-bold">{debtors.length} ta</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30"><CreditCard className="h-5 w-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Muddati o&apos;tganlar</p>
                <p className="text-xl font-bold text-red-600">{overdueCount} ta</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Qarzdorlar ro&apos;yxati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-5 bg-muted rounded w-24" />
                  <div className="h-5 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          ) : debtors.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Qarzdorlar yo&apos;q</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Hozircha hech qanday qarz mavjud emas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bemor</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Qarz miqdori</TableHead>
                  <TableHead>Oxirgi tashrif</TableHead>
                  <TableHead>Muddat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtors.map((debt) => (
                  <TableRow key={debt.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                          <span className="text-sm font-semibold text-red-600">{debt.patientName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="font-medium">{debt.patientName}</span>
                          {debt.reminderSent && (
                            <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                              <Bell className="h-2.5 w-2.5" /> Eslatma yuborilgan
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {debt.patientPhone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">{formatMoney(debt.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {debt.patientRecord?.visitDate
                          ? new Date(debt.patientRecord.visitDate).toLocaleDateString('uz-UZ')
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell>{getDeadlineBadge(debt.deadline)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Qo'ng'iroq qilish">
                          <a href={`tel:${debt.patientPhone.replace(/\s/g, '')}`}>
                            <Phone className="h-4 w-4 text-sky-600" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost" size="icon" title="SMS eslatma yuborish"
                          disabled={busyId === debt.id}
                          onClick={() => handleRemind(debt)}
                        >
                          {busyId === debt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4 text-amber-600" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 gap-1"
                          title="To'landi deb belgilash"
                          disabled={busyId === debt.id}
                          onClick={() => handlePay(debt)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          To&apos;landi
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
