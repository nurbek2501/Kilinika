'use client';

import { Menu, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const roleLabels: Record<string, string> = {
    DIRECTOR: 'Rahbar Panel',
    ADMIN: 'Admin Panel',
    DOCTOR: 'Shifokor Panel',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-card/70 backdrop-blur-xl px-4 lg:px-6">
      {/* sweeping highlight along the bottom edge */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent overflow-hidden">
        <div className="footer-glow-sweep absolute bottom-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
      </div>

      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 flex items-center gap-3">
        <span className="hidden sm:block h-6 w-1 rounded-full bg-gradient-to-b from-sky-500 to-sky-600" />
        <h2 className="text-lg font-bold tracking-tight">
          {user ? roleLabels[user.role] || 'Panel' : ''}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? "Yorug' rejim" : 'Tungi rejim'}
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-muted/60 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors overflow-hidden"
        >
          <Sun className={`w-[18px] h-[18px] absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
          <Moon className={`w-[18px] h-[18px] absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
        </button>

        <button
          onClick={handleLogout}
          aria-label="Chiqish"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
