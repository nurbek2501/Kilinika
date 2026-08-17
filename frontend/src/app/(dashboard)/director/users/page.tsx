'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User } from '@/types';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, Plus, MoreHorizontal, Pencil, Trash2, Phone, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserForm {
  name: string;
  phone: string;
  username: string;
  specialty: string;
  password: string;
  role: 'ADMIN' | 'DOCTOR';
}

const emptyForm: UserForm = { name: '', phone: '', username: '', specialty: '', password: '', role: 'DOCTOR' };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/director/users')
      .then(({ data }) => {
        if (data.success) setUsers(data.data);
      })
      .catch(() => toast.error('Foydalanuvchilar yuklanmadi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      phone: user.phone,
      username: user.username ?? '',
      specialty: user.specialty ?? '',
      password: '',
      role: user.role as 'ADMIN' | 'DOCTOR',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Ism va telefon to\'ldiring');
      return;
    }
    if (!editingUser && !form.password.trim()) {
      toast.error('Parol kiriting');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        name: form.name,
        phone: form.phone,
      };
      if (form.username.trim()) payload.username = form.username.trim();
      if (form.role === 'DOCTOR' && form.specialty.trim()) payload.specialty = form.specialty.trim();

      if (editingUser) {
        if (form.password.trim()) payload.password = form.password;
        payload.role = form.role;
        const { data } = await api.put(`/director/users/${editingUser.id}`, payload);
        if (data.success) {
          toast.success('Foydalanuvchi yangilandi');
          setDialogOpen(false);
          fetchUsers();
        }
      } else {
        payload.password = form.password;
        payload.role = form.role;
        const { data } = await api.post('/director/users', payload);
        if (data.success) {
          toast.success('Foydalanuvchi yaratildi');
          setDialogOpen(false);
          fetchUsers();
        }
      }
    } catch {
      toast.error(editingUser ? 'Yangilashda xatolik' : 'Yaratishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`${user.name} ni o'chirishni tasdiqlaysizmi?`)) return;
    try {
      const { data } = await api.delete(`/director/users/${user.id}`);
      if (data.success) {
        toast.success('Foydalanuvchi o\'chirildi');
        fetchUsers();
      }
    } catch {
      toast.error('O\'chirishda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
          <p className="text-muted-foreground">Admin va shifokorlarni boshqarish</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Yangi foydalanuvchi
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Barcha foydalanuvchilar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Hali foydalanuvchilar qo&apos;shilmagan</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                Birinchi foydalanuvchini qo&apos;shing
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{user.name}</span>
                          {user.role === 'DOCTOR' && user.specialty && (
                            <p className="text-xs text-muted-foreground">{user.specialty}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {user.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground">{user.username || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {user.role === 'ADMIN' ? 'Admin' : 'Shifokor'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Faol' : 'Nofaol'}
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
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                            Tahrirlash
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(user)}
                          >
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
            <DialogTitle>
              {editingUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Ma\'lumotlarni yangilang'
                : 'Admin yoki shifokor qo\'shing'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ism</Label>
              <Input
                id="name"
                placeholder="To'liq ism"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                placeholder="+998901234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Login <span className="text-muted-foreground font-normal">(ixtiyoriy)</span></Label>
              <Input
                id="username"
                placeholder="masalan: azizov_dent"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            {form.role === 'DOCTOR' && (
              <div className="space-y-2">
                <Label htmlFor="specialty">Mutaxassislik</Label>
                <Input
                  id="specialty"
                  placeholder="masalan: Ortodont, Terapevt"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                Parol {editingUser && <span className="text-muted-foreground font-normal">(bo&apos;sh qoldirsa o&apos;zgarmaydi)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={editingUser ? 'Yangi parol (ixtiyoriy)' : 'Parol kiriting'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val as 'ADMIN' | 'DOCTOR' })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Rol tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DOCTOR">Shifokor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Saqlanmoqda...' : editingUser ? 'Yangilash' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
