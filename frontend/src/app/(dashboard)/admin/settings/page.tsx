'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Settings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings2, Building, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => { if (data.success) setValues(data.data); })
      .catch(() => toast.error('Sozlamalar yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  const rows = [
    { icon: Building, label: 'Klinika nomi', value: values.clinicName },
    { icon: Phone, label: 'Telefon', value: values.clinicPhone },
    { icon: MapPin, label: 'Manzil', value: values.clinicAddress },
    { icon: Clock, label: 'Ish vaqti', value: values.workHours },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          Sozlamalar
        </h1>
        <p className="text-muted-foreground mt-1">Klinika ma&apos;lumotlari</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5 text-primary" /> Klinika ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 p-3 rounded-lg bg-accent/40">
                  <r.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground w-32 shrink-0">{r.label}</span>
                  <span className="font-medium">{r.value || '—'}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/40">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground w-32 shrink-0">SMS xabarnoma</span>
                <Badge className={values.smsEnabled === 'false'
                  ? 'bg-muted text-muted-foreground border-none'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none'}>
                  {values.smsEnabled === 'false' ? 'O\'chirilgan' : 'Yoqilgan'}
                </Badge>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Sozlamalarni faqat rahbar o&apos;zgartira oladi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
