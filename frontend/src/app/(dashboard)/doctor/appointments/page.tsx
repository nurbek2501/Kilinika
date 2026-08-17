'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Appointment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck, Phone, User, Clock, Globe, MessageCircle, Inbox,
  PlayCircle, CheckCircle2, XCircle, Loader2, Stethoscope, Info, UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

type Status = Appointment['status'];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: Status) {
  switch (status) {
    case 'IN_PROGRESS':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none">Qabulda</Badge>;
    case 'PENDING':
    default:
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none">Kutilmoqda</Badge>;
  }
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/doctor/appointments')
      .then(({ data }) => {
        if (data.success) setAppointments(data.data);
      })
      .catch(() => toast.error('Navbatlar yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (appt: Appointment, status: Status) => {
    setBusyId(appt.id);
    try {
      const { data } = await api.patch(`/doctor/appointments/${appt.id}/status`, { status });
      if (data.success) {
        if (status === 'IN_PROGRESS') {
          toast.success('Bemor qabulga chaqirildi');
          setAppointments((prev) => prev.map((a) => (a.id === appt.id ? { ...a, status } : a)));
        } else {
          toast.success(status === 'COMPLETED' ? 'Navbat yakunlandi' : 'Navbat bekor qilindi');
          setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
        }
      }
    } catch {
      toast.error('Amalda xatolik');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 bg-muted rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-none shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            Navbat
          </h1>
          <p className="text-muted-foreground mt-1">Sizga yozilgan bemorlar navbati</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/doctor/register">
            <UserPlus className="h-4 w-4" />
            Yangi bemor qo&apos;shish
          </Link>
        </Button>
      </div>

      {appointments.length > 0 && (
        <Badge variant="secondary" className="text-sm">Jami: {appointments.length} ta navbat</Badge>
      )}

      {appointments.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">Hozircha navbat yo&apos;q</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                Yangi navbatlar paydo bo&apos;lganda bu yerda ko&apos;rsatiladi
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment, index) => (
            <Card key={appointment.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">{index + 1}</span>
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-semibold truncate">{appointment.patientName}</p>
                      {statusBadge(appointment.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{appointment.patientPhone}</span>
                      {appointment.serviceType && (
                        <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" />{appointment.serviceType}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {appointment.scheduledAt ? formatTime(appointment.scheduledAt) : formatTime(appointment.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Badge variant="secondary" className={
                    appointment.source === 'WEB'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                  }>
                    {appointment.source === 'WEB'
                      ? <span className="flex items-center gap-1"><Globe className="h-3 w-3" />Web</span>
                      : <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />Telegram</span>}
                  </Badge>

                  {/* Status actions */}
                  <div className="flex items-center gap-1.5">
                    {appointment.status === 'PENDING' && (
                      <Button size="sm" variant="outline" className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        disabled={busyId === appointment.id}
                        onClick={() => updateStatus(appointment, 'IN_PROGRESS')}>
                        {busyId === appointment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                        Qabulga
                      </Button>
                    )}
                    {appointment.status === 'IN_PROGRESS' && (
                      <Button size="sm" className="gap-1"
                        disabled={busyId === appointment.id}
                        onClick={() => updateStatus(appointment, 'COMPLETED')}>
                        {busyId === appointment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Yakunlash
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" title="Bekor qilish"
                      disabled={busyId === appointment.id}
                      onClick={() => updateStatus(appointment, 'CANCELLED')}>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 border border-border/50">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>Barcha navbatlar har kuni soat 00:30 da avtomatik tarzda tozalanadi.</p>
      </div>
    </div>
  );
}
