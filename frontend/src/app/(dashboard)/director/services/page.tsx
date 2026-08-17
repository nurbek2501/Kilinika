'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ServicePrice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Stethoscope, Plus, MoreHorizontal, Pencil, Check, X, Tag,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

interface ServiceForm {
  nameUz: string;
  nameRu: string;
  nameEn: string;
  price: string;
}

const emptyForm: ServiceForm = { nameUz: '', nameRu: '', nameEn: '', price: '' };

export default function ServicesPage() {
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServicePrice | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Inline price editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  const fetchServices = () => {
    setLoading(true);
    api.get('/director/services')
      .then(({ data }) => {
        if (data.success) setServices(data.data);
      })
      .catch(() => toast.error('Xizmatlar yuklanmadi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => {
    setEditingService(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (service: ServicePrice) => {
    setEditingService(service);
    setForm({
      nameUz: service.nameUz,
      nameRu: service.nameRu,
      nameEn: service.nameEn,
      price: service.price.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nameUz.trim()) {
      toast.error('Xizmat nomini kiriting (O\'zbek)');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Narxni to\'g\'ri kiriting');
      return;
    }

    setSubmitting(true);
    const payload = {
      nameUz: form.nameUz,
      nameRu: form.nameRu,
      nameEn: form.nameEn,
      price: Number(form.price),
    };

    try {
      if (editingService) {
        const { data } = await api.put(`/director/services/${editingService.id}`, payload);
        if (data.success) {
          toast.success('Xizmat yangilandi');
          setDialogOpen(false);
          fetchServices();
        }
      } else {
        const { data } = await api.post('/director/services', payload);
        if (data.success) {
          toast.success('Xizmat qo\'shildi');
          setDialogOpen(false);
          fetchServices();
        }
      }
    } catch {
      toast.error(editingService ? 'Yangilashda xatolik' : 'Qo\'shishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const startInlineEdit = (service: ServicePrice) => {
    setEditingPriceId(service.id);
    setEditingPriceValue(service.price.toString());
  };

  const saveInlinePrice = async (service: ServicePrice) => {
    const newPrice = Number(editingPriceValue);
    if (!newPrice || newPrice <= 0) {
      toast.error('Narxni to\'g\'ri kiriting');
      return;
    }
    try {
      const { data } = await api.put(`/director/services/${service.id}`, {
        ...service,
        price: newPrice,
      });
      if (data.success) {
        toast.success('Narx yangilandi');
        setEditingPriceId(null);
        fetchServices();
      }
    } catch {
      toast.error('Narxni yangilashda xatolik');
    }
  };

  const cancelInlineEdit = () => {
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Xizmatlar</h1>
          <p className="text-muted-foreground">Klinika xizmatlarini boshqarish</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Yangi xizmat
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
            Xizmatlar ro&apos;yxati
            {!loading && (
              <Badge variant="secondary" className="ml-2">
                {services.length} ta
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/5" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                  <div className="h-5 bg-muted rounded w-28" />
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Xizmatlar yo&apos;q</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Birinchi xizmatni qo&apos;shing
              </p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                Xizmat qo&apos;shish
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xizmat nomi (UZ)</TableHead>
                  <TableHead>Nomi (RU)</TableHead>
                  <TableHead>Nomi (EN)</TableHead>
                  <TableHead>Narxi</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{service.nameUz}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.nameRu || '---'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.nameEn || '---'}
                    </TableCell>
                    <TableCell>
                      {editingPriceId === service.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            className="w-28 h-7"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlinePrice(service);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => saveInlinePrice(service)}
                          >
                            <Check className="h-3.5 w-3.5 text-sky-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={cancelInlineEdit}
                          >
                            <X className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="font-semibold text-primary cursor-pointer hover:underline"
                          onClick={() => startInlineEdit(service)}
                          title="Narxni o'zgartirish uchun bosing"
                        >
                          {formatMoney(service.price)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? 'default' : 'destructive'}>
                        {service.isActive ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(service)}>
                            <Pencil className="h-4 w-4" />
                            To&apos;liq tahrirlash
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
            <DialogTitle>
              {editingService ? 'Xizmatni tahrirlash' : 'Yangi xizmat'}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? 'Xizmat ma\'lumotlarini yangilang'
                : 'Yangi xizmat qo\'shing'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nameUz">Nomi (O&apos;zbek) *</Label>
              <Input
                id="nameUz"
                placeholder="Masalan: Tish plomba"
                value={form.nameUz}
                onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nameRu">Nomi (Rus)</Label>
                <Input
                  id="nameRu"
                  placeholder="Masalan: Пломба"
                  value={form.nameRu}
                  onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">Nomi (English)</Label>
                <Input
                  id="nameEn"
                  placeholder="e.g. Filling"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Narxi (so&apos;m) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="Masalan: 150000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Saqlanmoqda...' : editingService ? 'Yangilash' : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
