'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Receipt, DollarSign, FileText, Tag, CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

type ExpenseType = 'EXPENSE' | 'UTILITY';

const utilityCategories = [
  { value: 'ELECTRICITY', label: 'Elektr' },
  { value: 'WATER_GAS', label: 'Suv / Gaz' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'RENT', label: 'Ijara' },
  { value: 'OTHER', label: 'Boshqa' },
];

export default function ExpensesPage() {
  const [type, setType] = useState<ExpenseType>('EXPENSE');
  const [category, setCategory] = useState('ELECTRICITY');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ type: string; amount: number; description: string } | null>(null);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Miqdorni to\'g\'ri kiriting');
      return;
    }
    if (!description.trim()) {
      toast.error('Tavsifni kiriting');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/director/expenses', {
        type,
        amount: Number(amount),
        category: type === 'UTILITY' ? category : undefined,
        description: description.trim(),
      });
      if (data.success) {
        toast.success('Xarajat qo\'shildi');
        setLastAdded({ type, amount: Number(amount), description: description.trim() });
        setAmount('');
        setDescription('');
        setType('EXPENSE');
      }
    } catch {
      toast.error('Xarajat qo\'shishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Xarajatlar</h1>
        <p className="text-muted-foreground">Klinika xarajatlarini kiritish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-primary" />
              Yangi xarajat
            </CardTitle>
            <CardDescription>
              Xarajat turini, miqdorini va tavsifini kiriting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Xarajat turi
                </Label>
                <Select value={type} onValueChange={(val) => setType(val as ExpenseType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tur tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Umumiy xarajat</SelectItem>
                    <SelectItem value="UTILITY">Kommunal xarajat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'UTILITY' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    Kommunal kategoriyasi
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kategoriya tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {utilityCategories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Miqdor (so&apos;m)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Masalan: 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {amount && Number(amount) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(Number(amount))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Tavsif
                </Label>
                <Textarea
                  id="description"
                  placeholder="Xarajat haqida ma'lumot kiriting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full gap-1.5"
                size="lg"
              >
                {submitting ? (
                  'Saqlanmoqda...'
                ) : (
                  <>
                    <Receipt className="h-4 w-4" />
                    Xarajatni saqlash
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Umumiy xarajat
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Dori-darmon, materiallar, uskunalar va boshqa xarajatlar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Kommunal xarajat
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Elektr, gaz, suv, internet va ijara to&apos;lovlari
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {lastAdded && (
            <Card className="border-none shadow-md bg-sky-50/50 dark:bg-sky-950/20">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/40">
                    <CheckCircle className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-1">
                      Oxirgi qo&apos;shilgan
                    </p>
                    <p className="font-semibold text-sky-700 dark:text-sky-300">
                      {formatMoney(lastAdded.amount)}
                    </p>
                    <p className="text-sm text-sky-600/80 dark:text-sky-400/80 mt-0.5">
                      {lastAdded.type === 'EXPENSE' ? 'Umumiy xarajat' : 'Kommunal xarajat'} &mdash; {lastAdded.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
