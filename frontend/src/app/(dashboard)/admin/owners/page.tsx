'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Owner } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Wallet, PieChart, Phone } from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [totalEquity, setTotalEquity] = useState(0);
  const [totalPct, setTotalPct] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/owners')
      .then(({ data }) => {
        if (data.success) {
          setOwners(data.data.owners);
          setTotalEquity(data.data.totalEquity);
          setTotalPct(data.data.totalPct);
        }
      })
      .catch(() => toast.error('Mulkdorlar yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mulkdorlar</h1>
        <p className="text-muted-foreground">Klinika egalari va ularning ulushlari</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jami kapital</p>
                <p className="text-xl font-bold">{formatMoney(totalEquity)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30"><Wallet className="h-5 w-5 text-sky-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mulkdorlar soni</p>
                <p className="text-xl font-bold">{owners.length} ta</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30"><Building2 className="h-5 w-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taqsimlangan ulush</p>
                <p className="text-xl font-bold">{totalPct}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30"><PieChart className="h-5 w-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Egalar ro&apos;yxati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : owners.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Mulkdorlar mavjud emas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {owners.map((owner) => (
                <div key={owner.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-card/50">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-base font-semibold text-primary">{owner.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{owner.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {owner.title && <span>{owner.title}</span>}
                      {owner.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{owner.phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Ulush</p>
                    <p className="font-semibold text-emerald-600">{Number(owner.ownershipPct)}%</p>
                  </div>
                  <div className="text-right shrink-0 min-w-[120px]">
                    <p className="text-xs text-muted-foreground">Kapital</p>
                    <p className="font-semibold text-sky-600">{formatMoney(Number(owner.capitalBalance))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
