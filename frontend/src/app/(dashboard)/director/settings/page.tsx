'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Settings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Settings2, Building, DollarSign, MessageSquare, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DirectorSettingsPage() {
  const [values, setValues] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Commission is stored as a decimal (0.35) but edited as a percentage (35).
  // Keep the raw percent string in its own state so fractional values (e.g.
  // "12.5") aren't snapped by round-tripping through the decimal on every keystroke.
  const [commissionPct, setCommissionPct] = useState('');

  useEffect(() => {
    api.get('/director/settings')
      .then(({ data }) => {
        if (data.success) {
          setValues(data.data);
          if (data.data.doctorCommissionRate) {
            setCommissionPct(String(Number(data.data.doctorCommissionRate) * 100));
          }
        }
      })
      .catch(() => toast.error('Sozlamalar yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, val: string) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Settings = { ...values };
      // Convert the edited percent back to the stored decimal (35 -> "0.35").
      if (commissionPct.trim()) {
        payload.doctorCommissionRate = String(Number(commissionPct) / 100);
      }
      const { data } = await api.put('/director/settings', payload);
      if (data.success) {
        setValues(data.data);
        if (data.data.doctorCommissionRate) {
          setCommissionPct(String(Number(data.data.doctorCommissionRate) * 100));
        }
        toast.success('Sozlamalar saqlandi');
      }
    } catch {
      toast.error('Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="p-6 h-40" /></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            Sozlamalar
          </h1>
          <p className="text-muted-foreground mt-1">Klinika sozlamalari va parametrlari</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Saqlash
        </Button>
      </div>

      {/* Clinic info */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5 text-primary" /> Klinika ma&apos;lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Klinika nomi</Label>
              <Input value={values.clinicName ?? ''} onChange={(e) => set('clinicName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={values.clinicPhone ?? ''} onChange={(e) => set('clinicPhone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input value={values.clinicAddress ?? ''} onChange={(e) => set('clinicAddress', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ish vaqti</Label>
              <Input value={values.workHours ?? ''} onChange={(e) => set('workHours', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finance */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" /> Moliya
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Oylik byudjet (so&apos;m)</Label>
              <Input type="number" value={values.monthlyBudget ?? ''} onChange={(e) => set('monthlyBudget', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kvartal maqsad (so&apos;m)</Label>
              <Input type="number" value={values.quarterlyTarget ?? ''} onChange={(e) => set('quarterlyTarget', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Shifokor ulushi (%)</Label>
              <Input
                type="number" min="0" max="100" step="0.1"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Qarz muddati (kun)</Label>
              <Input type="number" value={values.debtReminderDays ?? ''} onChange={(e) => set('debtReminderDays', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" /> SMS xabarnoma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMS yuborish</Label>
              <Select value={values.smsEnabled ?? 'true'} onValueChange={(v) => set('smsEnabled', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yoqilgan</SelectItem>
                  <SelectItem value="false">O&apos;chirilgan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SMS jo&apos;natuvchi (Eskiz)</Label>
              <Input value={values.smsFrom ?? ''} onChange={(e) => set('smsFrom', e.target.value)} placeholder="4546" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            SMS haqiqiy yuborilishi uchun <span className="font-mono">backend/.env</span> faylida Eskiz.uz login/parol (ESKIZ_EMAIL, ESKIZ_PASSWORD) kiritilishi kerak.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
