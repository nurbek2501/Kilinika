'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Login va parolni kiriting');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
      const user = useAuthStore.getState().user;
      const redirectMap: Record<string, string> = {
        DIRECTOR: '/director',
        ADMIN: '/admin',
        DOCTOR: '/doctor',
      };
      toast.success('Muvaffaqiyatli kirildi!');
      router.push(redirectMap[user?.role || ''] || '/');
    } catch {
      toast.error('Login yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* ═══ Animated background (both themes) ═══ */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* aurora wash */}
        <div
          className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-700"
          style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(56, 189, 248,0.20), transparent 55%), radial-gradient(110% 90% at 90% 15%, rgba(56,189,248,0.16), transparent 55%), radial-gradient(120% 100% at 50% 100%, rgba(16,185,129,0.16), transparent 60%)' }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700"
          style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(56, 189, 248,0.10), transparent 55%), radial-gradient(120% 100% at 50% 100%, rgba(12,45,90,0.35), transparent 60%)' }}
        />
        {/* morphing blobs */}
        <div className="absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-gradient-to-br from-sky-400/30 via-sky-300/15 to-transparent dark:from-sky-400/18 dark:via-sky-300/8 blur-3xl animate-morph" />
        <div className="absolute -bottom-48 -right-32 w-[38rem] h-[38rem] rounded-full bg-gradient-to-tr from-sky-400/25 via-sky-400/12 to-transparent dark:from-sky-400/14 dark:via-sky-400/8 blur-3xl animate-morph" style={{ animationDelay: '4s' }} />
        {/* pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[30rem] h-[30rem] rounded-full border border-sky-500/15 dark:border-sky-400/10 animate-pulse-ring" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[44rem] h-[44rem] rounded-full border border-sky-500/10 dark:border-sky-400/[0.06] animate-pulse-ring" style={{ animationDelay: '1.5s' }} />
        </div>
        {/* dot grid */}
        <div
          className="absolute inset-0 text-[#0c2d5a] dark:text-sky-200 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        />
      </div>

      {/* ═══ Glass card ═══ */}
      <div className="relative w-full max-w-md">
        {/* glow behind card */}
        <div className="absolute -inset-1 rounded-[1.8rem] bg-gradient-to-br from-sky-400/25 via-sky-400/10 to-transparent blur-2xl" />

        <div className="relative rounded-[1.6rem] bg-card/70 backdrop-blur-2xl border border-border/60 shadow-2xl shadow-sky-500/10 overflow-hidden">
          {/* sweeping highlight along the top */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent overflow-hidden">
            <div className="footer-glow-sweep absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
          </div>

          <div className="px-8 pt-9 pb-8">
            {/* floating logo */}
            <div className="flex justify-center mb-3">
              <div className="animate-float">
                <Logo size="lg" />
              </div>
            </div>
            <h1 className="text-center text-2xl font-extrabold tracking-tight mb-1">Xush kelibsiz</h1>
            <p className="text-center text-muted-foreground text-sm mb-7">
              Tizimga kirish uchun ma&apos;lumotlaringizni kiriting
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Login */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold">Login</label>
                <div className="field-3d px-4">
                  <User className="field-icon w-5 h-5 shrink-0" />
                  <input
                    id="phone"
                    type="text"
                    placeholder="Login kiriting"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-3 placeholder:text-muted-foreground/60"
                    autoFocus
                  />
                </div>
              </div>

              {/* Parol */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold">Parol</label>
                <div className="field-3d px-4">
                  <Lock className="field-icon w-5 h-5 shrink-0" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Parolni kiriting"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-3 pr-9 placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    className="field-icon absolute right-4 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-xl shadow-sky-500/25 border-0 rounded-2xl transition-all hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Kirish...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Kirish
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* footer strip */}
          <div className="px-8 py-4 border-t border-border/50 bg-muted/20 text-center">
            <p className="mono text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase">
              KDC — Kamoliddin Dental Clinic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
