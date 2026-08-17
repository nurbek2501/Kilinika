'use client';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 52, text: 'text-3xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <KDCLogoIcon size={s.icon} />
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight text-[#0c2d5a] dark:text-sky-100 ${s.text}`}>
          Kamoliddin
        </span>
        <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-sky-500 dark:text-sky-400">
          Dental Clinic
        </span>
      </div>
    </div>
  );
}

export function KDCLogoIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="logoCircleGrad" x1="30" y1="30" x2="170" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f3460" />
          <stop offset="50%" stopColor="#0c2d5a" />
          <stop offset="100%" stopColor="#081d3f" />
        </linearGradient>
        <linearGradient id="logoSwoosh" x1="30" y1="100" x2="170" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="logoArc" x1="20" y1="60" x2="80" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Outer teal arc */}
      <path
        d="M 35 140 A 85 85 0 0 1 55 45"
        stroke="url(#logoArc)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Main dark circle */}
      <circle cx="100" cy="100" r="72" fill="url(#logoCircleGrad)" />

      {/* Tooth shape — realistic cusped crown + tapering roots */}
      <path
        d="M74 95 C64 89 60 73 62 59 C64 49 72 42 80 42 C87 42 92 48 100 51 C108 48 113 42 120 42 C128 42 136 49 138 59 C140 73 136 89 126 95 C128 109 126 129 120 147 C118 151 114 151 112 145 C108 131 104 115 102 105 C101 102 99 102 98 105 C96 115 92 131 88 145 C86 151 82 151 80 147 C74 129 72 109 74 95Z"
        fill="white"
      />
      {/* Subtle tooth shading on the left crown */}
      <path
        d="M74 95 C64 89 60 73 62 59 C64 49 72 42 80 42 C87 42 92 48 100 51 C100 84 100 84 100 105 C99 102 99 102 98 105 C96 115 92 131 88 145 C86 151 82 151 80 147 C74 129 72 109 74 95Z"
        fill="#0c2d5a"
        opacity="0.06"
      />

      {/* Teal swoosh crossing the tooth */}
      <path
        d="M 38 108 C 60 88 85 102 100 95 C 115 88 140 78 165 92"
        stroke="url(#logoSwoosh)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
