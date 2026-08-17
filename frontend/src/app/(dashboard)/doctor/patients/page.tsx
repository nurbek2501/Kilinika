'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { PatientRecord } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, Search, ChevronLeft, ChevronRight, Inbox, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const paymentLabels: Record<string, string> = {
  CASH: 'Naqd',
  CLICK: 'Click',
  DEBT: 'Qarz',
};

const paymentColors: Record<string, string> = {
  CASH: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  CLICK: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  DEBT: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
};

interface PaginatedResponse {
  records: PatientRecord[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPatients = useCallback((searchTerm: string, pageNum: number) => {
    setLoading(true);
    api.get('/doctor/patients', { params: { search: searchTerm, page: pageNum } })
      .then(({ data }) => {
        if (data.success) {
          const res: Partial<PaginatedResponse> & { patients?: PatientRecord[] } = data.data;
          setPatients(res.records || res.patients || []);
          setTotalPages(res.totalPages || 1);
          setTotal(res.total || 0);
        }
      })
      .catch(() => toast.error('Bemorlar yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  // Debounce the search term and reset to the first page when it changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Single source of truth for fetching — React batches the debounce's two state
  // updates into one render, so this fires exactly once per change (no dup on mount).
  useEffect(() => {
    fetchPatients(debouncedSearch, page);
  }, [debouncedSearch, page, fetchPatients]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Bemorlarim
        </h1>
        <p className="text-muted-foreground mt-1">
          Siz qabul qilgan barcha bemorlar
        </p>
      </div>

      {/* Search bar */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Bemor ismi yoki telefon raqami bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results info */}
      {!loading && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-sm">
            Jami: {total} ta bemor
          </Badge>
          <p className="text-sm text-muted-foreground">
            Sahifa {page} / {totalPages}
          </p>
        </div>
      )}

      {/* Table */}
      <Card className="border-none shadow-md overflow-hidden">
        {loading ? (
          <CardContent className="p-0">
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50 animate-pulse">
                  <div className="h-4 bg-muted rounded w-8" />
                  <div className="h-4 bg-muted rounded flex-1" />
                  <div className="h-4 bg-muted rounded w-28" />
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        ) : patients.length === 0 ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                Bemorlar topilmadi
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {search ? 'Qidiruv natijasi bo\'sh' : 'Hali bemorlar yo\'q'}
              </p>
            </div>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-12 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Bemor</TableHead>
                  <TableHead className="font-semibold">Telefon</TableHead>
                  <TableHead className="font-semibold">Tashxis</TableHead>
                  <TableHead className="font-semibold">To&apos;lov</TableHead>
                  <TableHead className="font-semibold">Summa</TableHead>
                  <TableHead className="font-semibold">Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient, i) => (
                  <TableRow key={patient.id} className="hover:bg-accent/50 transition-colors">
                    <TableCell className="font-medium text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {patient.fullName.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{patient.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {patient.gender === 'MALE' ? 'Erkak' : 'Ayol'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{patient.phone}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {patient.diagnosis}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={paymentColors[patient.paymentType] || ''}>
                        {paymentLabels[patient.paymentType] || patient.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {formatMoney(patient.amount)}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(patient.visitDate)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Oldingi
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                typeof p === 'string' ? (
                  <span key={`dots-${idx}`} className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    className="w-9"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                )
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="gap-1"
          >
            Keyingi
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
