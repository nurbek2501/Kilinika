'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Owner } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2, Plus, MoreHorizontal, Pencil, Trash2, PieChart, Wallet, Phone,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

interface OwnerForm {
  name: string;
  title: string;
  phone: string;
  ownershipPct: string;
  capitalBalance: string;
}

const emptyForm: OwnerForm = { name: '', title: '', phone: '', ownershipPct: '', capitalBalance: '' };

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [totalEquity, setTotalEquity] = useState(0);
  const [totalPct, setTotalPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [form, setForm] = useState<OwnerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchOwners = () => {
    setLoading(true);
    api.get('/director/owners')
      .then(({ data }) => {
        if (data.success) {
          setOwners(data.data.owners);
          setTotalEquity(data.data.totalEquity);
          setTotalPct(data.data.totalPct);
        }
      })
      .catch(() => toast.error('Mulkdorlar yuklanmadi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOwners(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (owner: Owner) => {
    setEditing(owner);
    setForm({
      name: owner.name,
      title: owner.title ?? '',
      phone: owner.phone ?? '',
      ownershipPct: String(owner.ownershipPct),
      capitalBalance: String(owner.capitalBalance),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Ismni kiriting');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        title: form.title || undefined,
        phone: form.phone || undefined,
        ownershipPct: form.ownershipPct ? Number(form.ownershipPct) : 0,
        capitalBalance: form.capitalBalance ? Number(form.capitalBalance) : 0,
      };
      if (editing) {
        const { data } = await api.put(`/director/owners/${editing.id}`, payload);
        if (data.success) { toast.success('Mulkdor yangilandi'); setDialogOpen(false); fetchOwners(); }
      } else {
        const { data } = await api.post('/director/owners', payload);
        if (data.success) { toast.success('Mulkdor qo\'shildi'); setDialogOpen(false); fetchOwners(); }
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || (editing ? 'Yangilashda xatolik' : 'Qo\'shishda xatolik'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (owner: Owner) => {
    if (!confirm(`${owner.name} ni ro'yxatdan olib tashlaysizmi?`)) return;
    try {
      const { data } = await api.delete(`/director/owners/${owner.id}`);
      if (data.success) { toast.success('Mulkdor olib tashlandi'); fetchOwners(); }
    } catch {
      toast.error('O\'chirishda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mulkdorlar</h1>
          <p className="text-muted-foreground">Klinika egalari, ulushlar va kapital</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Yangi mulkdor
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jami kapital</p>
                <p className="text-xl font-bold">{formatMoney(totalEquity)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30">
                <Wallet className="h-5 w-5 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mulkdorlar soni</p>
                <p className="text-xl font-bold">{owners.length} ta</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taqsimlangan ulush</p>
                <p className={`text-xl font-bold ${totalPct > 100 ? 'text-red-600' : ''}`}>{totalPct}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <PieChart className="h-5 w-5 text-emerald-600" />
              </div>
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
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-5 bg-muted rounded w-24" />
                </div>
              ))}
            </div>
          ) : owners.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Hali mulkdorlar qo&apos;shilmagan</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                Birinchi mulkdorni qo&apos;shing
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mulkdor</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Ulush</TableHead>
                  <TableHead>Kapital balans</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {owner.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{owner.name}</span>
                          {owner.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {owner.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{owner.title || '—'}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">{Number(owner.ownershipPct)}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sky-600">{formatMoney(Number(owner.capitalBalance))}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(owner)}>
                            <Pencil className="h-4 w-4" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(owner)}>
                            <Trash2 className="h-4 w-4" />
                            O&apos;chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Mulkdorni tahrirlash' : 'Yangi mulkdor'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Ma\'lumotlarni yangilang' : 'Klinika egasi / aksiyadorini qo\'shing'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ism *</Label>
              <Input id="name" placeholder="To'liq ism" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Lavozim</Label>
              <Input id="title" placeholder="Masalan: Bosh shifokor, Investor" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" placeholder="+998 90 123 45 67" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownershipPct">Ulush (%)</Label>
                <Input id="ownershipPct" type="number" min="0" max="100" placeholder="0" value={form.ownershipPct}
                  onChange={(e) => setForm({ ...form, ownershipPct: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capitalBalance">Kapital (so&apos;m)</Label>
                <Input id="capitalBalance" type="number" min="0" placeholder="0" value={form.capitalBalance}
                  onChange={(e) => setForm({ ...form, capitalBalance: e.target.value })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Saqlanmoqda...' : editing ? 'Yangilash' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
