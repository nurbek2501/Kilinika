'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Stethoscope, UserCircle } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  phone?: string;
  patientCount?: number;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/doctors')
      .then(({ data }) => {
        if (data.success) setDoctors(data.data);
      })
      .catch(() => toast.error('Shifokorlar yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Shifokorlar
        </h1>
        <p className="text-muted-foreground mt-1">
          Klinika shifokorlari ro&apos;yxati
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Shifokorlar yo&apos;q</p>
              <p className="text-sm">Hali shifokorlar qo&apos;shilmagan</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">
                      {doctor.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-base truncate">{doctor.name}</p>
                    {doctor.phone && (
                      <p className="text-sm text-muted-foreground">{doctor.phone}</p>
                    )}
                    {doctor.patientCount !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <UserCircle className="inline h-3 w-3 mr-1" />
                        {doctor.patientCount} ta bemor
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
