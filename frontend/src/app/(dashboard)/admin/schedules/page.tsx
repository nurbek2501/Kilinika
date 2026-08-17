'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Appointment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck, Phone, User, Clock, Stethoscope, Globe, MessageCircle, Inbox, XCircle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type ApptWithDoctor = Appointment & { doctor?: { id: string; name: string } };

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: Appointment['status']) {
  if (status === 'IN_PROGRESS') {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none">Qabulda</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none">Kutilmoqda</Badge>;
}

export default function AdminSchedulesPage() {
  const [appointments, setAppointments] = useState<ApptWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/appointments')
      .then(({ data }) => { if (data.success) setAppointments(data.data); })
      .catch(() => toast.error('Navbatlar yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (appt: ApptWithDoctor) => {
    if (!confirm(`${appt.patientName} navbatini bekor qilasizmi?`)) return;
    setBusyId(appt.id);
    try {
      const { data } = await api.patch(`/admin/appointments/${appt.id}/status`, { status: 'CANCELLED' });
      if (data.success) {
        toast.success('Navbat bekor qilindi');
        setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
      }
    } catch {
      toast.error('Bekor qilishda xatolik');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          Navbat jadvali
        </h1>
        <p className="text-muted-foreground mt-1">Barcha shifokorlarning navbatlari</p>
      </div>

      {appointments.length > 0 && (
        <Badge variant="secondary" className="text-sm">Jami: {appointments.length} ta navbat</Badge>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-none shadow-md"><CardContent className="p-5 h-20" /></Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">Hozircha navbat yo&apos;q</h3>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt, index) => (
            <Card key={appt.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-semibold truncate">{appt.patientName}</p>
                      {statusBadge(appt.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{appt.patientPhone}</span>
                      {appt.doctor?.name && (
                        <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" />{appt.doctor.name}</span>
                      )}
                      {appt.serviceType && <span>{appt.serviceType}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {appt.scheduledAt ? formatTime(appt.scheduledAt) : formatTime(appt.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className={
                    appt.source === 'WEB'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                  }>
                    {appt.source === 'WEB'
                      ? <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Web</span>
                      : <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />Telegram</span>}
                  </Badge>
                  <Button size="icon" variant="ghost" title="Bekor qilish" disabled={busyId === appt.id} onClick={() => cancel(appt)}>
                    {busyId === appt.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
