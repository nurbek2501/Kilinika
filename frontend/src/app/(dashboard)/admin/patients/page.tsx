'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { PatientRecord } from '@/types';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  MapPin,
  CalendarDays,
  Stethoscope,
  CreditCard,
  FileText,
  UserCircle,
} from 'lucide-react';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function PaymentBadge({ type }: { type: string }) {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    CASH: { label: 'Naqd', variant: 'default' },
    CLICK: { label: 'Click', variant: 'secondary' },
    DEBT: { label: 'Qarz', variant: 'destructive' },
  };
  const info = variants[type] || { label: type, variant: 'secondary' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const limit = 20;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/patients', {
        params: { search, page, limit },
      });
      if (data.success) {
        setPatients(data.data.records || data.data.patients || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch {
      toast.error('Bemorlar ro\'yxati yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchPatients]);

  function handleViewPatient(patient: PatientRecord) {
    setSelectedPatient(patient);
    setDialogOpen(true);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Bemorlar ro&apos;yxati
        </h1>
        <p className="text-muted-foreground mt-1">
          Barcha bemorlar ma&apos;lumotlari
        </p>
      </div>

      {/* Search */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ism, telefon yoki tashxis bo'yicha qidirish..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-10 bg-muted rounded flex-1" />
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Bemorlar topilmadi</p>
              <p className="text-sm">
                {search ? 'Qidiruv natijasi bo\'sh' : 'Hali bemorlar qo\'shilmagan'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="hidden md:table-cell">Tashxis</TableHead>
                  <TableHead className="hidden lg:table-cell">Shifokor</TableHead>
                  <TableHead className="hidden md:table-cell">Sana</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>To&apos;lov</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer"
                    onClick={() => handleViewPatient(patient)}
                  >
                    <TableCell className="font-medium">{patient.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">{patient.diagnosis}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {patient.doctor?.name || '---'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(patient.visitDate)}
                    </TableCell>
                    <TableCell className="font-medium">{formatMoney(patient.amount)}</TableCell>
                    <TableCell>
                      <PaymentBadge type={patient.paymentType} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPatient(patient);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sahifa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Keyingi
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Patient Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              Bemor ma&apos;lumotlari
            </DialogTitle>
            <DialogDescription>
              {selectedPatient?.fullName || 'Bemor'}
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-4 mt-2">
              {/* Personal Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Shaxsiy ma&apos;lumotlar
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={UserCircle} label="Ism" value={selectedPatient.fullName} />
                  <InfoRow
                    icon={CalendarDays}
                    label="Tug'ilgan sana"
                    value={formatDate(selectedPatient.birthDate)}
                  />
                  <InfoRow
                    icon={UserCircle}
                    label="Jinsi"
                    value={selectedPatient.gender === 'MALE' ? 'Erkak' : 'Ayol'}
                  />
                  <InfoRow icon={Phone} label="Telefon" value={selectedPatient.phone} />
                  {selectedPatient.address && (
                    <InfoRow icon={MapPin} label="Manzil" value={selectedPatient.address} />
                  )}
                  {selectedPatient.occupation && (
                    <InfoRow icon={FileText} label="Kasbi" value={selectedPatient.occupation} />
                  )}
                </div>
              </div>

              {/* Medical Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Tibbiy ma&apos;lumotlar
                </h4>
                <div className="space-y-3">
                  <InfoRow icon={Stethoscope} label="Tashxis" value={selectedPatient.diagnosis} />
                  <InfoRow
                    icon={Stethoscope}
                    label="Shifokor"
                    value={selectedPatient.doctor?.name || '---'}
                  />
                  {selectedPatient.dailyAnalysis && (
                    <div className="rounded-lg bg-accent/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Kundalik tahlil</p>
                      <p className="text-sm">{selectedPatient.dailyAnalysis}</p>
                    </div>
                  )}
                  {selectedPatient.treatmentHistory && (
                    <div className="rounded-lg bg-accent/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Davolash tarixi</p>
                      <p className="text-sm">{selectedPatient.treatmentHistory}</p>
                    </div>
                  )}
                  {selectedPatient.treatmentPlan && (
                    <div className="rounded-lg bg-accent/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Davolash rejasi</p>
                      <p className="text-sm">{selectedPatient.treatmentPlan}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  To&apos;lov
                </h4>
                <div className="flex items-center justify-between rounded-lg bg-accent/50 p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatMoney(selectedPatient.amount)}
                    </span>
                  </div>
                  <PaymentBadge type={selectedPatient.paymentType} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
