'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, User, Phone, MapPin, Briefcase, Stethoscope, FileText,
  CreditCard, Loader2, Plus, Trash2, MessageSquare, PenLine, Eraser,
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
}

const diagnosisOptions = [
  { value: 'Tishlarni davolash', label: 'Tishlarni davolash' },
  { value: 'Tish olish', label: 'Tish olish' },
  { value: 'Parodontit', label: 'Parodontit' },
  { value: 'Karies', label: 'Karies' },
  { value: 'Implantatsiya', label: 'Implantatsiya' },
  { value: 'Boshqa', label: 'Boshqa' },
];

const genderOptions = [
  { value: 'MALE', label: 'Erkak' },
  { value: 'FEMALE', label: 'Ayol' },
];

const paymentOptions = [
  { value: 'CASH', label: 'Naqd' },
  { value: 'CLICK', label: 'Click / Payme' },
  { value: 'DEBT', label: 'Qarz' },
];

const initialFormState = {
  fullName: '', birthDate: '', gender: '', phone: '', address: '', occupation: '',
  diagnosis: '', dailyAnalysis: '', treatmentHistory: '', paymentType: '', amount: '', doctorId: '',
};

interface Props {
  /** API endpoint to POST to: '/admin/patients' or '/doctor/patients'. */
  endpoint: string;
  /** Admin/reception needs a doctor selector; the doctor form posts for itself. */
  showDoctorSelect: boolean;
}

export function PatientRegistrationForm({ endpoint, showDoctorSelect }: Props) {
  const [form, setForm] = useState(initialFormState);
  const [plans, setPlans] = useState<string[]>(['']);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(showDoctorSelect);

  useEffect(() => {
    if (!showDoctorSelect) return;
    api.get('/admin/doctors')
      .then(({ data }) => { if (data.success) setDoctors(data.data); })
      .catch(() => toast.error('Shifokorlar yuklanmadi'))
      .finally(() => setLoadingDoctors(false));
  }, [showDoctorSelect]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }
  function handleSelectChange(name: string, value: string | null) {
    setForm((prev) => ({ ...prev, [name]: value ?? '' }));
  }

  // ── Treatment plan rows ("Reja qo'shish") ──
  const updatePlan = (i: number, val: string) =>
    setPlans((prev) => prev.map((p, idx) => (idx === i ? val : p)));
  const addPlan = () => setPlans((prev) => [...prev, '']);
  const removePlan = (i: number) => setPlans((prev) => prev.filter((_, idx) => idx !== i));

  // ── Signature pad ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const applyStyle = () => {
      if (!ctx) return;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f3460';
    };

    // Keep the drawing buffer matched to the displayed size so pointer
    // coordinates stay aligned after layout changes (rotation, sidebar toggle).
    // Setting width/height clears the canvas, so preserve any existing ink.
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w === 0 || h === 0 || (canvas.width === w && canvas.height === h)) return;
      const snapshot = canvas.width && canvas.height ? canvas.toDataURL() : null;
      canvas.width = w;
      canvas.height = h;
      applyStyle();
      if (snapshot) {
        const img = new Image();
        img.onload = () => ctx?.drawImage(img, 0, 0, w, h);
        img.src = snapshot;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
  };
  const endDraw = () => { drawing.current = false; };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.fullName || !form.phone || !form.diagnosis || !form.paymentType
      || !form.gender || !form.birthDate || (showDoctorSelect && !form.doctorId)) {
      toast.error('Majburiy maydonlarni to\'ldiring');
      return;
    }

    setSubmitting(true);
    try {
      const treatmentPlan = plans.map((p) => p.trim()).filter(Boolean).join('\n');
      const consentImage = hasSignature ? canvasRef.current?.toDataURL('image/png') : undefined;

      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        birthDate: form.birthDate,
        gender: form.gender,
        phone: form.phone,
        address: form.address || undefined,
        occupation: form.occupation || undefined,
        diagnosis: form.diagnosis,
        dailyAnalysis: form.dailyAnalysis || undefined,
        treatmentHistory: form.treatmentHistory || undefined,
        treatmentPlan: treatmentPlan || undefined,
        paymentType: form.paymentType,
        amount: form.amount ? Number(form.amount) : 0,
        consentImage,
      };
      if (showDoctorSelect) payload.doctorId = form.doctorId;

      const { data } = await api.post(endpoint, payload);
      if (data.success) {
        toast.success('Bemor muvaffaqiyatli ro\'yxatdan o\'tkazildi');
        setForm(initialFormState);
        setPlans(['']);
        clearSignature();
      } else {
        toast.error(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      toast.error('Bemor ro\'yxatdan o\'tkazishda xatolik');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          Bemor qo&apos;shish
        </h1>
        <p className="text-muted-foreground mt-1">Yangi kasallik varaqasini yarating va bemorni navbatga qo&apos;shing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Shaxsiy ma&apos;lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">To&apos;liq ism *</Label>
                <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Familiya Ism Sharif" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Tug&apos;ilgan sana</Label>
                <Input id="birthDate" name="birthDate" type="date" value={form.birthDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Jinsi *</Label>
                <Select value={form.gender} onValueChange={(val) => handleSelectChange('gender', val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone"><Phone className="inline h-3.5 w-3.5 mr-1" /> Telefon *</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+998 90 123 45 67" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address"><MapPin className="inline h-3.5 w-3.5 mr-1" /> Manzil</Label>
                <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="Shahar, tuman, ko'cha" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation"><Briefcase className="inline h-3.5 w-3.5 mr-1" /> Kasbi</Label>
                <Input id="occupation" name="occupation" value={form.occupation} onChange={handleChange} placeholder="Kasbi" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" /> Tibbiy ma&apos;lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tashxis *</Label>
                <Select value={form.diagnosis} onValueChange={(val) => handleSelectChange('diagnosis', val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Tashxisni tanlang" /></SelectTrigger>
                  <SelectContent>
                    {diagnosisOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {showDoctorSelect && (
                <div className="space-y-2">
                  <Label>Shifokor *</Label>
                  <Select value={form.doctorId} onValueChange={(val) => handleSelectChange('doctorId', val)} disabled={loadingDoctors}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingDoctors ? 'Yuklanmoqda...' : 'Shifokorni tanlang'} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dailyAnalysis">Kunlik tahlil</Label>
                <Textarea id="dailyAnalysis" name="dailyAnalysis" value={form.dailyAnalysis} onChange={handleChange} placeholder="Kundalik tahlil natijalari..." rows={3} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="treatmentHistory">Davolash tarixi</Label>
                <Textarea id="treatmentHistory" name="treatmentHistory" value={form.treatmentHistory} onChange={handleChange} placeholder="Oldingi davolash tarixi..." rows={3} />
              </div>

              {/* Multiple treatment plan rows */}
              <div className="space-y-2 md:col-span-2">
                <Label>Davolash rejasi</Label>
                <div className="space-y-2">
                  {plans.map((plan, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={plan} onChange={(e) => updatePlan(i, e.target.value)} placeholder={`${i + 1}-bosqich`} />
                      {plans.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePlan(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 mt-1" onClick={addPlan}>
                  <Plus className="h-4 w-4" /> Reja qo&apos;shish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" /> To&apos;lov ma&apos;lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>To&apos;lov turi *</Label>
                <Select value={form.paymentType} onValueChange={(val) => handleSelectChange('paymentType', val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="To'lov turini tanlang" /></SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Summa</Label>
                <Input id="amount" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="0" min="0" />
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-sky-50/60 dark:bg-sky-950/20 rounded-lg p-3 border border-sky-100 dark:border-sky-900/40">
              <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-sky-600" />
              <p>Ro&apos;yxatdan o&apos;tgach, bemorning telefoniga xizmat tafsilotlari va narxi ko&apos;rsatilgan SMS xabar yuboriladi.</p>
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenLine className="h-5 w-5 text-primary" /> Tasdiqnoma (Imzo)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Bemor yoki qarindoshi tasdiqnomasi — quyiga imzo qo&apos;ying.</p>
            <div className="rounded-xl border border-dashed border-border bg-muted/20 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-40 touch-none cursor-crosshair"
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">* Elektron imzo huquqiy kuchga ega.</span>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={clearSignature}>
                <Eraser className="h-4 w-4" /> Tozalash
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} size="lg" className="min-w-[200px]">
            {submitting
              ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saqlanmoqda...</>)
              : (<><FileText className="h-4 w-4 mr-2" /> Ro&apos;yxatga olishni yakunlash</>)}
          </Button>
        </div>
      </form>
    </div>
  );
}
