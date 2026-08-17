'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Phone, MapPin, Clock, ChevronRight, Calendar,
  Shield, Award, Heart, Sparkles, CheckCircle2,
  Star, Send, Menu, X, ArrowUpRight, Plus, Sun, Moon,
  User, Stethoscope, ChevronDown, Check,
} from 'lucide-react';
import { ServicePrice } from '@/types';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Lang = 'uz' | 'ru' | 'en';

/* ── Reusable SVG paths (KDC official mark) ── */
const TOOTH_PATH =
  'M74 95 C64 89 60 73 62 59 C64 49 72 42 80 42 C87 42 92 48 100 51 C108 48 113 42 120 42 C128 42 136 49 138 59 C140 73 136 89 126 95 C128 109 126 129 120 147 C118 151 114 151 112 145 C108 131 104 115 102 105 C101 102 99 102 98 105 C96 115 92 131 88 145 C86 151 82 151 80 147 C74 129 72 109 74 95Z';
const SWOOSH_PATH = 'M 38 108 C 60 88 85 102 100 95 C 115 88 140 78 165 92';

const translations = {
  uz: {
    nav: { services: 'Xizmatlar', about: 'Biz haqimizda', booking: 'Navbat olish', login: 'Kirish' },
    intro: { tagline: 'ZAMONAVIY STOMATOLOGIYA KLINIKASI', est: 'EST. 2015', loading: 'YUKLANMOQDA' },
    hero: {
      badge: 'Professional stomatologik klinika',
      title1: "Sog'lom",
      titleHighlight: 'tabassumingiz',
      title2: '— bizning maqsadimiz',
      subtitle: "Zamonaviy uskunalar va tajribali shifokorlar bilan sifatli stomatologik xizmat ko'rsatamiz",
      slogan: "SIFAT · ISHONCH · GO'ZAL TABASSUM",
      cta: 'Navbat olish',
      secondary: 'Xizmatlarimiz',
      tap: 'NAVBAT · OLISH · ',
    },
    stats: { patients: 'Mamnun bemorlar', experience: 'Yillik tajriba', services: 'Xizmat turlari', doctors: 'Malakali shifokorlar' },
    servicesSection: {
      title: 'Bizning xizmatlar',
      subtitle: 'Barcha turdagi stomatologik xizmatlar bir joyda',
      badge: 'Xizmatlar',
      loading: 'XIZMATLAR YUKLANMOQDA',
      view: 'Batafsil',
      priceLabel: 'Narxi',
      descTitle: 'Xizmat haqida',
      stepsTitle: 'Davolash bosqichlari',
      galleryLabel: 'Jarayon',
      book: 'Navbatga yozilish',
      process: ['Konsultatsiya', 'Diagnostika', 'Davolash', 'Nazorat'],
      descTemplate: (n: string) =>
        `${n} — xalqaro standartlarga mos, og'riqsiz va zamonaviy uskunalar yordamida amalga oshiriladi. Har bir bemor uchun individual yondashuv va kafolatli natija.`,
    },
    features: {
      title: 'Nega aynan biz?',
      subtitle: "Sizning sog'lom tabassumingiz uchun eng yaxshi sharoitlar",
      items: [
        { title: 'Zamonaviy uskunalar', desc: "Eng so'nggi texnologiyalar bilan jihozlangan klinika" },
        { title: 'Tajribali shifokorlar', desc: '10+ yillik tajribaga ega mutaxassislar jamoasi' },
        { title: 'Qulay narxlar', desc: "Sifat va narx o'rtasida mukammal muvozanat" },
        { title: 'Steril muhit', desc: 'Xalqaro standartlarga mos sterilizatsiya tizimi' },
      ],
    },
    testimonials: {
      badge: 'Fikrlar',
      title: 'Mamnun mijozlar fikrlari',
      subtitle: 'Bizga ishongan bemorlarimizning samimiy izohlari',
      items: [
        { name: 'Dilnoza Karimova', role: 'Bemor', text: "Juda professional jamoa! Tishimni og'riqsiz davolashdi, natijadan juda mamnunman. Hammaga tavsiya qilaman.", rating: 5 },
        { name: 'Jasur Toshmatov', role: 'Bemor', text: 'Zamonaviy uskunalar va samimiy munosabat. Implant qo\'ydirdim — hammasi mukammal darajada bajarildi.', rating: 5 },
        { name: 'Malika Yusupova', role: 'Bemor', text: "Bolamni olib bordim, shifokorlar juda mehribon. Endi tish shifokoridan qo'rqmaydi. Rahmat KDC!", rating: 5 },
        { name: 'Sardor Aliyev', role: 'Bemor', text: 'Narxlari qulay, sifati esa a\'lo. Tish oqartirish qildirdim, tabassumim butunlay o\'zgardi.', rating: 5 },
        { name: 'Nigora Rasulova', role: 'Bemor', text: "Toza, steril va qulay muhit. Har bir bosqich tushuntirib berildi. Ishonchli klinika.", rating: 5 },
      ],
    },
    booking: {
      kicker: 'ONLAYN QABUL',
      morphFrom: 'Shifongiz kerakmi?',
      morphTo: 'NAVBAT OLING',
      subtitle: 'Onlayn navbat oling — tez va qulay',
      name: 'Ismingiz',
      phone: 'Telefon raqamingiz',
      doctor: 'Shifokor tanlang',
      submit: 'Navbat olish',
      success: 'Navbatingiz tasdiqlandi!',
      selectDoctor: 'Shifokorni tanlang',
    },
    contact: { title: 'Aloqa', address: 'Toshkent shahri', workHours: 'Dush-Shan: 09:00 - 18:00' },
    footer: { rights: 'Barcha huquqlar himoyalangan', tagline: 'Professional stomatologik xizmatlar' },
  },
  ru: {
    nav: { services: 'Услуги', about: 'О нас', booking: 'Запись', login: 'Войти' },
    intro: { tagline: 'СОВРЕМЕННАЯ СТОМАТОЛОГИЧЕСКАЯ КЛИНИКА', est: 'EST. 2015', loading: 'ЗАГРУЗКА' },
    hero: {
      badge: 'Профессиональная стоматологическая клиника',
      title1: 'Здоровая',
      titleHighlight: 'улыбка',
      title2: '— наша цель',
      subtitle: 'Качественные стоматологические услуги с современным оборудованием и опытными врачами',
      slogan: 'КАЧЕСТВО · ДОВЕРИЕ · КРАСИВАЯ УЛЫБКА',
      cta: 'Записаться',
      secondary: 'Наши услуги',
      tap: 'ЗАПИСЬ · ОНЛАЙН · ',
    },
    stats: { patients: 'Довольных пациентов', experience: 'Лет опыта', services: 'Видов услуг', doctors: 'Квалиф. врачей' },
    servicesSection: {
      title: 'Наши услуги',
      subtitle: 'Все виды стоматологических услуг в одном месте',
      badge: 'Услуги',
      loading: 'ЗАГРУЗКА УСЛУГ',
      view: 'Подробнее',
      priceLabel: 'Цена',
      descTitle: 'Об услуге',
      stepsTitle: 'Этапы лечения',
      galleryLabel: 'Процесс',
      book: 'Записаться на приём',
      process: ['Консультация', 'Диагностика', 'Лечение', 'Контроль'],
      descTemplate: (n: string) =>
        `${n} — выполняется по международным стандартам, безболезненно и с использованием современного оборудования. Индивидуальный подход и гарантированный результат.`,
    },
    features: {
      title: 'Почему именно мы?',
      subtitle: 'Лучшие условия для вашей здоровой улыбки',
      items: [
        { title: 'Современное оборудование', desc: 'Клиника оснащена новейшими технологиями' },
        { title: 'Опытные врачи', desc: 'Команда специалистов с 10+ летним опытом' },
        { title: 'Доступные цены', desc: 'Идеальный баланс качества и цены' },
        { title: 'Стерильная среда', desc: 'Стерилизация по международным стандартам' },
      ],
    },
    testimonials: {
      badge: 'Отзывы',
      title: 'Отзывы довольных клиентов',
      subtitle: 'Искренние отзывы пациентов, которые нам доверились',
      items: [
        { name: 'Дилноза Каримова', role: 'Пациент', text: 'Очень профессиональная команда! Лечение прошло безболезненно, результатом очень довольна. Всем рекомендую.', rating: 5 },
        { name: 'Жасур Тошматов', role: 'Пациент', text: 'Современное оборудование и душевное отношение. Поставил имплант — всё сделано на высшем уровне.', rating: 5 },
        { name: 'Малика Юсупова', role: 'Пациент', text: 'Водила ребёнка, врачи очень добрые. Теперь он не боится стоматолога. Спасибо KDC!', rating: 5 },
        { name: 'Сардор Алиев', role: 'Пациент', text: 'Доступные цены и отличное качество. Сделал отбеливание — улыбка полностью преобразилась.', rating: 5 },
        { name: 'Нигора Расулова', role: 'Пациент', text: 'Чисто, стерильно и уютно. Каждый этап объяснили. Надёжная клиника.', rating: 5 },
      ],
    },
    booking: {
      kicker: 'ОНЛАЙН ПРИЁМ',
      morphFrom: 'Нужен врач?',
      morphTo: 'ЗАПИШИТЕСЬ',
      subtitle: 'Онлайн запись — быстро и удобно',
      name: 'Ваше имя',
      phone: 'Номер телефона',
      doctor: 'Выберите врача',
      submit: 'Записаться',
      success: 'Запись подтверждена!',
      selectDoctor: 'Выберите врача',
    },
    contact: { title: 'Контакты', address: 'г. Ташкент', workHours: 'Пн-Сб: 09:00 - 18:00' },
    footer: { rights: 'Все права защищены', tagline: 'Профессиональные стоматологические услуги' },
  },
  en: {
    nav: { services: 'Services', about: 'About', booking: 'Book Now', login: 'Login' },
    intro: { tagline: 'MODERN DENTAL CLINIC', est: 'EST. 2015', loading: 'LOADING' },
    hero: {
      badge: 'Professional Dental Clinic',
      title1: 'Your healthy',
      titleHighlight: 'smile',
      title2: 'is our mission',
      subtitle: 'Quality dental services with modern equipment and experienced doctors',
      slogan: 'QUALITY · TRUST · BEAUTIFUL SMILE',
      cta: 'Book Appointment',
      secondary: 'Our Services',
      tap: 'TAP · TO · START · ',
    },
    stats: { patients: 'Happy patients', experience: 'Years experience', services: 'Service types', doctors: 'Qualified doctors' },
    servicesSection: {
      title: 'Our Services',
      subtitle: 'All types of dental services in one place',
      badge: 'Services',
      loading: 'LOADING SERVICES',
      view: 'Details',
      priceLabel: 'Price',
      descTitle: 'About service',
      stepsTitle: 'Treatment stages',
      galleryLabel: 'Process',
      book: 'Book an appointment',
      process: ['Consultation', 'Diagnostics', 'Treatment', 'Follow-up'],
      descTemplate: (n: string) =>
        `${n} — performed to international standards, painlessly and with modern equipment. An individual approach and a guaranteed result for every patient.`,
    },
    features: {
      title: 'Why choose us?',
      subtitle: 'The best conditions for your healthy smile',
      items: [
        { title: 'Modern Equipment', desc: 'Clinic equipped with the latest technologies' },
        { title: 'Experienced Doctors', desc: 'Team of specialists with 10+ years of experience' },
        { title: 'Affordable Prices', desc: 'Perfect balance of quality and price' },
        { title: 'Sterile Environment', desc: 'Sterilization to international standards' },
      ],
    },
    testimonials: {
      badge: 'Reviews',
      title: 'What Our Happy Clients Say',
      subtitle: 'Genuine feedback from patients who trusted us',
      items: [
        { name: 'Dilnoza Karimova', role: 'Patient', text: 'A truly professional team! My treatment was painless and I am very happy with the result. Highly recommend.', rating: 5 },
        { name: 'Jasur Toshmatov', role: 'Patient', text: 'Modern equipment and a warm attitude. I got an implant — everything was done perfectly.', rating: 5 },
        { name: 'Malika Yusupova', role: 'Patient', text: 'I brought my child, the doctors are so kind. Now he is not afraid of the dentist. Thank you KDC!', rating: 5 },
        { name: 'Sardor Aliyev', role: 'Patient', text: 'Affordable prices and excellent quality. I had whitening done and my smile completely changed.', rating: 5 },
        { name: 'Nigora Rasulova', role: 'Patient', text: 'Clean, sterile and comfortable. Every step was explained. A trustworthy clinic.', rating: 5 },
      ],
    },
    booking: {
      kicker: 'ONLINE APPOINTMENT',
      morphFrom: 'Need a dentist?',
      morphTo: 'BOOK NOW',
      subtitle: 'Online booking — fast and convenient',
      name: 'Your name',
      phone: 'Phone number',
      doctor: 'Select doctor',
      submit: 'Book Now',
      success: 'Appointment confirmed!',
      selectDoctor: 'Select a doctor',
    },
    contact: { title: 'Contact', address: 'Tashkent city', workHours: 'Mon-Sat: 09:00 - 18:00' },
    footer: { rights: 'All rights reserved', tagline: 'Professional dental services' },
  },
};

/* ── Extra section i18n: doctors showcase + app download (functions from Stitch) ── */
const sectionsI18n = {
  uz: {
    navDoctors: 'Shifokorlar',
    docBadge: 'Jamoa',
    docTitle: 'Mutaxassislarimiz',
    docSubtitle: "Har bir tabassum ortida ko'p yillik tajribaga ega professional shifokorlarimiz turadi.",
    docRole: 'Shifokor',
    docBook: 'Navbat olish',
    appTitle: 'Ilovamizni yuklab oling',
    appSubtitle: "Navbatga yozilish, davolash tarixini kuzatib borish va maxsus chegirmalardan xabardor bo'lish yanada osonlashdi.",
    appStoreTop: "App Store'dan",
    googlePlayTop: "Google Play'dan",
  },
  ru: {
    navDoctors: 'Врачи',
    docBadge: 'Команда',
    docTitle: 'Наши специалисты',
    docSubtitle: 'За каждой улыбкой стоят наши профессиональные врачи с многолетним опытом.',
    docRole: 'Врач',
    docBook: 'Записаться',
    appTitle: 'Скачайте наше приложение',
    appSubtitle: 'Запись на приём, отслеживание истории лечения и специальные скидки стали ещё удобнее.',
    appStoreTop: 'в App Store',
    googlePlayTop: 'в Google Play',
  },
  en: {
    navDoctors: 'Doctors',
    docBadge: 'Team',
    docTitle: 'Our Specialists',
    docSubtitle: 'Behind every smile stand our professional doctors with many years of experience.',
    docRole: 'Doctor',
    docBook: 'Book now',
    appTitle: 'Download our app',
    appSubtitle: 'Booking appointments, tracking treatment history and special discounts are now even easier.',
    appStoreTop: 'on the App Store',
    googlePlayTop: 'on Google Play',
  },
};

/* ── Per-service keyword pairs (editorial, uppercase) ── */
const SERVICE_KEYWORDS: Record<string, [string, string]> = {
  'Tish plomba': ['TIKLASH', 'CHIDAMLILIK'],
  'Tishni davolash': ["OG'RIQSIZ", 'ZAMONAVIY'],
  'Tish olish': ['XAVFSIZ', 'TEZKOR'],
  'Implantatsiya': ['ISHONCHLILIK', 'UZOQ MUDDAT'],
  'Implantatsiya (1 ta)': ['ISHONCHLILIK', 'UZOQ MUDDAT'],
  'Tish tozalash': ['TOZALIK', 'YANGILANISH'],
  'Estetik plomba': ["GO'ZALLIK", 'TABIIYLIK'],
  'Braket tizimi': ['TEKISLIK', 'MUTANOSIBLIK'],
  'Protez': ['FUNKSIYA', 'QULAYLIK'],
  'Koronka': ['MUSTAHKAMLIK', 'ESTETIKA'],
};
const KEYWORD_FALLBACKS: [string, string][] = [
  ['SIFAT', "GO'ZALLIK"],
  ['ISHONCH', 'KAFOLAT'],
  ['SALOMATLIK', 'PARVARISH'],
  ['ANIQLIK', 'TAJRIBA'],
];
function getKeywords(nameUz: string, index: number): [string, string] {
  return SERVICE_KEYWORDS[nameUz] || KEYWORD_FALLBACKS[index % KEYWORD_FALLBACKS.length];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('uz-UZ').format(price);
}
function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/* Uzbek national number after the +998 prefix, grouped as "90 123 45 67" */
function formatPhoneNational(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}

/* ── Respect the user's reduced-motion preference in JS-driven animations ── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/* ══════════ Logo variants (for morphing navbar mark) ══════════ */
function LogoVariant({ variant }: { variant: number }) {
  const uid = `lv${variant}`;
  if (variant === 1) {
    // Tooth outline only
    return (
      <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
        <path d={TOOTH_PATH} stroke="#0ea5e9" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={SWOOSH_PATH} stroke="#0c2d5a" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>
    );
  }
  if (variant === 2) {
    // KDC monogram
    return (
      <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`${uid}c`} x1="30" y1="30" x2="170" y2="170"><stop offset="0%" stopColor="#0f3460" /><stop offset="100%" stopColor="#081d3f" /></linearGradient>
        </defs>
        <circle cx="100" cy="100" r="82" fill={`url(#${uid}c)`} />
        <path d="M 30 165 A 90 90 0 0 1 48 42" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.75" />
        <text x="100" y="118" textAnchor="middle" fontSize="52" fontWeight="800" fill="white" fontFamily="ui-sans-serif, system-ui" letterSpacing="-2">KDC</text>
      </svg>
    );
  }
  // Full logo (default)
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}c`} x1="30" y1="30" x2="170" y2="170"><stop offset="0%" stopColor="#0f3460" /><stop offset="100%" stopColor="#081d3f" /></linearGradient>
        <linearGradient id={`${uid}s`} x1="30" y1="100" x2="170" y2="100"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#0ea5e9" /></linearGradient>
      </defs>
      <path d="M 35 140 A 85 85 0 0 1 55 45" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />
      <circle cx="100" cy="100" r="72" fill={`url(#${uid}c)`} />
      <path d={TOOTH_PATH} fill="white" />
      <path d={SWOOSH_PATH} stroke={`url(#${uid}s)`} strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function MorphingLogo() {
  const [v, setV] = useState(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setV((x) => (x + 1) % 3), 3400);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <button
      type="button"
      aria-label="KDC logo"
      onMouseEnter={() => setV((x) => (x + 1) % 3)}
      className="relative w-10 h-10 shrink-0"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 transition-all duration-500"
          style={{ opacity: v === i ? 1 : 0, transform: `scale(${v === i ? 1 : 0.72}) rotate(${v === i ? 0 : -18}deg)` }}
        >
          <LogoVariant variant={i} />
        </span>
      ))}
    </button>
  );
}

/* ══════════ Cinematic Preloader + brand intro ══════════ */
type Phase = 'idle' | 'loading' | 'brand' | 'out' | 'done';

function Preloader({ phase, t }: { phase: Phase; t: (typeof translations)['uz'] }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (phase !== 'loading') return;
    let raf = 0;
    const start = performance.now();
    const dur = 1550;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setPct(Math.floor(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const showBrand = phase === 'brand' || phase === 'out';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ opacity: phase === 'out' ? 0 : 1, transition: 'opacity 600ms ease' }}
    >
      {/* Phase 1 — loading bar on black */}
      {phase === 'loading' && (
        <div className="absolute inset-0 bg-[#050b16] flex flex-col items-center justify-center">
          <div className="w-[min(78vw,420px)]">
            <div className="flex items-end justify-between mb-3">
              <span className="mono text-[11px] tracking-[0.35em] text-sky-300/80">{t.intro.loading}</span>
              <span className="mono text-[11px] tracking-[0.2em] text-white/50">{pad2(pct)}%</span>
            </div>
            <div className="relative h-[3px] w-full bg-white/10 overflow-hidden">
              <div className="loading-bar absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-sky-500" />
            </div>
            <div className="mt-5 mono text-[10px] tracking-[0.4em] text-white/25">KAMOLIDDIN DENTAL CLINIC</div>
          </div>
          {/* Scanline texture */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
            <div className="scanline h-8 w-full bg-gradient-to-b from-transparent via-sky-300 to-transparent" />
          </div>
        </div>
      )}

      {/* Phase 2 — cinematic brand reveal */}
      {showBrand && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'radial-gradient(120% 120% at 50% 40%, #0c2d5a 0%, #081d3f 55%, #04101f 100%)' }}>
          {/* soft teal glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-sky-400/10 blur-3xl animate-morph" />
          <div className="relative w-40 h-40 md:w-52 md:h-52 intro-logo-in">
            <LogoVariant variant={0} />
          </div>
          <div className="intro-line mt-8 h-px w-40 bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
          <p className="intro-fade-up mt-6 mono text-[10px] md:text-xs text-sky-200/80 text-center px-6" style={{ letterSpacing: '0.32em' }}>
            {t.intro.tagline}
          </p>
          <p className="intro-fade-up mono text-[10px] text-white/35 mt-3" style={{ animationDelay: '0.75s', letterSpacing: '0.4em' }}>
            {t.intro.est}
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════ Animated tooth hero + reactive particle field ══════════ */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rectLeft = 0;
    let rectTop = 0;

    type P = { x: number; y: number; bx: number; by: number; vx: number; vy: number; r: number };
    let particles: P[] = [];

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.floor((width * height) / 5200));
      particles = Array.from({ length: count }, (_, i) => {
        // Deterministic-ish spread so re-mounts look stable
        const gx = ((i * 97) % 100) / 100;
        const gy = ((i * 57 + 13) % 100) / 100;
        const x = gx * width;
        const y = gy * height;
        return { x, y, bx: x, by: y, vx: (gx - 0.5) * 0.25, vy: (gy - 0.5) * 0.25, r: 1 + (i % 3) * 0.7 };
      });
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 45, 90, 0.16)';
        ctx.fill();
      }
    };

    build();

    // Reduced motion: render a single static field, keep it correct on resize, no rAF.
    if (reduced) {
      drawStatic();
      const onResizeStatic = () => { build(); drawStatic(); };
      window.addEventListener('resize', onResizeStatic);
      return () => window.removeEventListener('resize', onResizeStatic);
    }

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      const mx = mouse.current.x;
      const my = mouse.current.y;
      for (const p of particles) {
        // gentle drift + return to base
        p.x += p.vx;
        p.y += p.vy;
        p.x += (p.bx - p.x) * 0.01;
        p.y += (p.by - p.y) * 0.01;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.hypot(dx, dy);
        const near = dist < 120;
        const t = near ? 1 - dist / 120 : 0;

        if (near) {
          p.x += (dx / (dist || 1)) * t * 1.4;
          p.y += (dy / (dist || 1)) * t * 1.4;
        }

        const r = p.r + t * 2.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = near ? `rgba(14, 165, 233, ${0.35 + t * 0.5})` : 'rgba(12, 45, 90, 0.16)';
        ctx.fill();

        if (near) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(14, 165, 233, ${t * 0.28})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    };

    let rafId = 0;
    let running = false;
    const loop = () => { renderFrame(); rafId = requestAnimationFrame(loop); };
    const start = () => { if (running) return; running = true; rafId = requestAnimationFrame(loop); };
    const stop = () => { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; };

    // Only animate while the canvas is actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start(); else stop(); },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX - rectLeft;
      mouse.current.y = e.clientY - rectTop;
    };
    const onLeave = () => { mouse.current.x = -9999; mouse.current.y = -9999; };
    const onResize = () => build();
    const onScroll = () => { rectLeft = canvas.getBoundingClientRect().left; rectTop = canvas.getBoundingClientRect().top; };

    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/* ══════════ Global animated site background (both themes) ══════════ */
function GlobalParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; bx: number; by: number; vx: number; vy: number; r: number };
    let particles: P[] = [];

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(150, Math.floor((width * height) / 13000));
      particles = Array.from({ length: count }, (_, i) => {
        const gx = ((i * 97) % 100) / 100;
        const gy = ((i * 57 + 13) % 100) / 100;
        const x = gx * width, y = gy * height;
        return { x, y, bx: x, by: y, vx: (gx - 0.5) * 0.3, vy: (gy - 0.5) * 0.3, r: 1 + (i % 3) * 0.8 };
      });
    };
    build();

    const RADIUS = 210; // cursor influence radius — larger = wider glowing halo
    const draw = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);
      const mx = mouse.current.x, my = mouse.current.y;
      const hasMouse = mx > -9000;
      const dark = document.documentElement.classList.contains('dark');
      // deeper, more saturated dots on the light background for clear contrast
      const baseFill = dark ? 'rgba(14, 165, 233, 0.22)' : 'rgba(2, 132, 199, 0.30)';

      // soft glowing halo around the cursor
      if (animate && hasMouse) {
        const halo = ctx.createRadialGradient(mx, my, 0, mx, my, RADIUS);
        halo.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
        halo.addColorStop(0.5, 'rgba(56, 189, 248, 0.06)');
        halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(mx - RADIUS, my - RADIUS, RADIUS * 2, RADIUS * 2);
      }

      const lit: P[] = [];
      for (const p of particles) {
        if (animate) {
          p.x += p.vx; p.y += p.vy;
          p.x += (p.bx - p.x) * 0.008; p.y += (p.by - p.y) * 0.008;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.hypot(dx, dy);
        const near = animate && hasMouse && dist < RADIUS;
        const t = near ? 1 - dist / RADIUS : 0;
        if (near) {
          p.x += (dx / (dist || 1)) * t * 2.2;
          p.y += (dy / (dist || 1)) * t * 2.2;
          lit.push(p);
        }

        ctx.save();
        if (near) {
          // bright, glowing dot near the cursor
          ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
          ctx.shadowBlur = 8 + t * 16;
          ctx.fillStyle = `rgba(94, 234, 212, ${0.5 + t * 0.5})`;
        } else {
          ctx.fillStyle = baseFill;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + t * 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // bright link from the cursor to each lit particle
        if (near) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(56, 189, 248, ${t * 0.55})`;
          ctx.lineWidth = 0.6 + t * 1.1;
          ctx.stroke();
        }
      }

      // connect nearby lit particles to each other — a glowing web under the cursor
      for (let i = 0; i < lit.length; i++) {
        for (let j = i + 1; j < lit.length; j++) {
          const a = lit[i], b = lit[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(94, 234, 212, ${(1 - d / 110) * 0.4})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    if (reduced) {
      draw(false);
      const onResizeStatic = () => { build(); draw(false); };
      window.addEventListener('resize', onResizeStatic);
      return () => window.removeEventListener('resize', onResizeStatic);
    }

    let rafId = 0;
    const loop = () => { draw(true); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY; };
    // only clear when the pointer actually leaves the window (not when crossing child elements)
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) { mouse.current.x = -9999; mouse.current.y = -9999; }
    };
    const onResize = () => build();
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

function SiteBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* base surface (adapts to theme token) */}
      <div className="absolute inset-0 bg-background" />

      {/* soft aurora wash — richer in light mode so it never looks flat/white */}
      <div className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-700"
        style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(56, 189, 248,0.20), transparent 55%), radial-gradient(110% 90% at 90% 15%, rgba(56,189,248,0.16), transparent 55%), radial-gradient(120% 100% at 50% 100%, rgba(16,185,129,0.16), transparent 60%)' }}
      />
      {/* subtle dark-mode aurora */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700"
        style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(56, 189, 248,0.10), transparent 55%), radial-gradient(120% 100% at 50% 100%, rgba(12,45,90,0.35), transparent 60%)' }}
      />

      {/* morphing gradient blobs — like the glow around the hero logo (stronger in light) */}
      <div className="absolute -top-40 -left-32 w-[38rem] h-[38rem] rounded-full bg-gradient-to-br from-sky-400/35 via-sky-300/20 to-transparent dark:from-sky-400/20 dark:via-sky-300/10 blur-3xl animate-morph" />
      <div className="absolute top-1/4 -right-48 w-[44rem] h-[44rem] rounded-full bg-gradient-to-br from-sky-400/28 via-blue-500/15 to-transparent dark:from-sky-400/15 dark:via-blue-500/8 blur-3xl animate-morph" style={{ animationDelay: '3s' }} />
      <div className="absolute -bottom-56 left-1/5 w-[42rem] h-[42rem] rounded-full bg-gradient-to-tr from-sky-400/28 via-sky-400/15 to-transparent dark:from-sky-400/15 dark:via-sky-400/8 blur-3xl animate-morph" style={{ animationDelay: '6s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-sky-300/15 dark:bg-sky-300/8 blur-3xl animate-float-slow" />

      {/* concentric pulse rings, centered — echoes the logo's rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[26rem] h-[26rem] rounded-full border border-sky-500/20 dark:border-sky-400/10 animate-pulse-ring" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[40rem] h-[40rem] rounded-full border border-sky-500/12 dark:border-sky-400/[0.07] animate-pulse-ring" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* faint dot grid */}
      <div className="absolute inset-0 text-[#0c2d5a] dark:text-sky-200 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      {/* reactive particle constellation */}
      <div className="absolute inset-0"><GlobalParticles /></div>
    </div>
  );
}

function ToothHero() {
  return (
    <div className="relative w-[min(320px,80vw)] h-[min(380px,95vw)] sm:w-[320px] sm:h-[380px] md:w-[420px] md:h-[480px] mx-auto">
      {/* reactive particles */}
      <div className="absolute inset-0">
        <ParticleField />
      </div>

      {/* Soft glow behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-sky-400/15 via-sky-300/10 to-blue-900/10 animate-morph blur-3xl" />

      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-72 h-72 md:w-[22rem] md:h-[22rem] rounded-full border-2 border-sky-400/10 animate-pulse-ring" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-56 h-56 md:w-72 md:h-72 rounded-full border border-blue-900/5 animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main logo — floating */}
      <div className="absolute inset-0 flex items-center justify-center animate-float">
        <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-56 h-56 md:w-72 md:h-72" style={{ filter: 'drop-shadow(0 20px 50px rgba(12,45,90,0.35))' }}>
          <defs>
            <linearGradient id="heroCircleGrad" x1="30" y1="30" x2="210" y2="210" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f3460" />
              <stop offset="50%" stopColor="#0c2d5a" />
              <stop offset="100%" stopColor="#081d3f" />
            </linearGradient>
            <linearGradient id="heroSwoosh" x1="30" y1="120" x2="210" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="heroArc" x1="20" y1="60" x2="80" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="heroShine" x1="80" y1="40" x2="140" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            {/* Realistic enamel: bright white crown → warm ivory roots */}
            <linearGradient id="heroEnamel" x1="120" y1="54" x2="120" y2="172" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="42%" stopColor="#f4f7f8" />
              <stop offset="72%" stopColor="#ece3d3" />
              <stop offset="100%" stopColor="#d9ccb4" />
            </linearGradient>
            <radialGradient id="heroEnamelHi" cx="104" cy="82" r="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heroCervical" cx="120" cy="118" r="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8a6d3f" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8a6d3f" stopOpacity="0" />
            </radialGradient>
            <clipPath id="heroToothClip">
              <path d="M94 114 C84 108 80 92 82 78 C84 68 92 61 100 61 C107 61 112 67 120 70 C128 67 133 61 140 61 C148 61 156 68 158 78 C160 92 156 108 146 114 C148 128 146 148 140 166 C138 170 134 170 132 164 C128 150 124 134 122 124 C121 121 119 121 118 124 C116 134 112 150 108 164 C106 170 102 170 100 166 C94 148 92 128 94 114Z" />
            </clipPath>
          </defs>

          <g style={{ animation: 'spin-slow 20s linear infinite', transformOrigin: '120px 120px' }}>
            <path d="M 38 170 A 100 100 0 0 1 62 48" stroke="url(#heroArc)" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>

          <circle cx="120" cy="120" r="86" fill="url(#heroCircleGrad)" />
          <circle cx="120" cy="120" r="84" fill="none" stroke="white" strokeOpacity="0.04" strokeWidth="1" />

          {/* Realistic human tooth: cusped enamel crown, cervical neck, two tapering roots */}
          <g clipPath="url(#heroToothClip)">
            <path
              d="M94 114 C84 108 80 92 82 78 C84 68 92 61 100 61 C107 61 112 67 120 70 C128 67 133 61 140 61 C148 61 156 68 158 78 C160 92 156 108 146 114 C148 128 146 148 140 166 C138 170 134 170 132 164 C128 150 124 134 122 124 C121 121 119 121 118 124 C116 134 112 150 108 164 C106 170 102 170 100 166 C94 148 92 128 94 114Z"
              fill="url(#heroEnamel)"
            />
            {/* soft top-left enamel highlight */}
            <rect x="70" y="50" width="80" height="90" fill="url(#heroEnamelHi)" />
            {/* warm shadow at the cervical neck / gum line */}
            <rect x="78" y="96" width="84" height="46" fill="url(#heroCervical)" />
            {/* central fissure + cusp grooves on the crown */}
            <path d="M120 72 C119 80 119 88 120 98" stroke="#c3b79c" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M108 66 C106 76 106 86 105 96" stroke="#c9bda2" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M132 66 C134 76 134 86 135 96" stroke="#c9bda2" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.3" />
            {/* root separation shadow */}
            <path d="M120 126 C119 140 118 152 116 164" stroke="#a58a5c" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.25" />
            {/* glossy specular streak */}
            <ellipse cx="101" cy="84" rx="9" ry="24" fill="white" opacity="0.55" transform="rotate(-14 101 84)" />
            {/* animated shine sweep */}
            <rect x="-40" y="30" width="60" height="160" fill="url(#heroShine)" opacity="0.7" className="animate-shine" />
          </g>
          {/* subtle enamel edge */}
          <path
            d="M94 114 C84 108 80 92 82 78 C84 68 92 61 100 61 C107 61 112 67 120 70 C128 67 133 61 140 61 C148 61 156 68 158 78 C160 92 156 108 146 114 C148 128 146 148 140 166 C138 170 134 170 132 164 C128 150 124 134 122 124 C121 121 119 121 118 124 C116 134 112 150 108 164 C106 170 102 170 100 166 C94 148 92 128 94 114Z"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <path d="M 42 130 C 68 106 96 122 120 114 C 144 106 172 94 200 110" stroke="url(#heroSwoosh)" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M 48 126 C 72 104 98 118 120 110 C 142 102 168 92 194 106" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.15" />
        </svg>
      </div>

      {/* Orbiting sparkle elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute"
            style={{
              animation: `orbit ${12 + i * 3}s linear infinite`,
              animationDelay: `${i * -2.5}s`,
              ['--orbit-radius' as string]: `${110 + i * 22}px`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14">
              {i % 3 === 0 ? (
                <polygon points="7,0 8.5,5 14,7 8.5,9 7,14 5.5,9 0,7 5.5,5" fill="#38bdf8" opacity="0.5" />
              ) : i % 3 === 1 ? (
                <circle cx="7" cy="7" r="2.5" fill="#0ea5e9" opacity="0.35" />
              ) : (
                <rect x="3" y="3" width="8" height="8" rx="2" fill="#0c2d5a" opacity="0.2" transform="rotate(45 7 7)" />
              )}
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════ Scroll reveal ══════════
   All reveal targets (stat cards, section headers, booking card) render on the
   first paint regardless of async data, so a one-time mount setup is correct. */
function useGlobalReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );
    const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ══════════ Animated counter ══════════ */
function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    if (reduced) { setCount(end); return; }
    let frame: number;
    const duration = 2000;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [started, end, reduced]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ══════════ Scramble text (slogan) ══════════ */
function ScrambleText({ text, className, start }: { text: string; className?: string; start: boolean }) {
  const [display, setDisplay] = useState(text);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!start || reduced) { setDisplay(text); return; }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#·';
    let raf = 0;
    const startT = performance.now();
    const dur = 950;
    const total = text.length;
    const tick = (now: number) => {
      const p = Math.min((now - startT) / dur, 1);
      const revealed = Math.floor(p * total);
      let out = '';
      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (ch === ' ') { out += ' '; continue; }
        if (i < revealed) { out += ch; }
        else { out += chars[Math.floor(now / 28 + i * 7) % chars.length]; }
      }
      setDisplay(out);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf = requestAnimationFrame(tick);
    // Backstop: guarantee the final text even if rAF is throttled (hidden tab)
    const settle = setTimeout(() => setDisplay(text), dur + 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(settle); };
  }, [start, text, reduced]);
  return <span className={className}>{display}</span>;
}

/* ══════════ Rotating circular badge (TAP TO START) ══════════ */
function RotatingBadge({ label }: { label: string }) {
  const text = (label.trim() + ' ').repeat(3);
  return (
    <div className="pointer-events-none absolute -right-7 -top-7 z-20 opacity-0 scale-75 transition-all duration-300 group-hover/cta:opacity-100 group-hover/cta:scale-100">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full spin-badge text-[#0c2d5a]">
          <defs>
            <path id="tapCirclePath" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
          </defs>
          <text className="fill-current" fontSize="9.5" fontWeight="700" letterSpacing="1.2">
            <textPath href="#tapCirclePath" startOffset="0">{text}</textPath>
          </text>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════ Dots-circle spinner ══════════ */
function DotsSpinner() {
  return (
    <div className="relative w-6 h-6 dots-spinner">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-white"
          style={{
            transform: `rotate(${i * 45}deg) translateY(-9px)`,
            transformOrigin: '0 0',
            opacity: 0.25 + (i / 8) * 0.75,
            marginLeft: '-3px',
            marginTop: '-3px',
          }}
        />
      ))}
    </div>
  );
}

/* ══════════ 3D tilt card ══════════ */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const onMove = (e: React.MouseEvent) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // normalize to -1..1 so the tilt reaches the intended ±6deg at the edges
    const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.transform = `perspective(800px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-4px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateY(0)';
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt-3d ${className}`}>
      {children}
    </div>
  );
}

/* ══════════ Service detail modal (case-study) ══════════ */
function ServiceModal({
  service, index, lang, t, onClose, onBook,
}: {
  service: ServicePrice;
  index: number;
  lang: Lang;
  t: (typeof translations)['uz'];
  onClose: () => void;
  onBook: () => void;
}) {
  const name = lang === 'uz' ? service.nameUz : lang === 'ru' ? service.nameRu : service.nameEn;
  const [kwA, kwB] = getKeywords(service.nameUz, index);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = `svc-modal-title-${service.id}`;

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // move focus into the dialog
    cardRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === cardRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  const galleryTiles = [0, 1, 2, 3];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <div className="modal-backdrop absolute inset-0 bg-[#04101f]/80 backdrop-blur-md" onClick={onClose} />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="modal-card relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-card shadow-2xl shadow-black/40 border border-border/50 outline-none"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors border border-border/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Left — content */}
          <div className="p-8 sm:p-10">
            <span className="mono text-xs tracking-[0.3em] text-primary/70">({pad2(index + 1)})</span>
            <h3 id={titleId} className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{name}</h3>

            <div className="mt-5 flex flex-wrap gap-2">
              {[kwA, kwB].map((kw) => (
                <span key={kw} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                  {kw}
                </span>
              ))}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{t.servicesSection.descTitle}</p>
            <p className="mt-1 text-base leading-relaxed text-foreground/90">{t.servicesSection.descTemplate(name)}</p>

            <div className="mt-8">
              <p className="mono text-xs tracking-[0.25em] text-muted-foreground mb-4">{t.servicesSection.stepsTitle.toUpperCase()}</p>
              <div className="flex flex-wrap gap-2.5">
                {t.servicesSection.process.map((step, si) => (
                  <span key={step} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/60 border border-border/50 text-sm font-medium">
                    <span className="mono text-[10px] text-primary">{pad2(si + 1)}</span>
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-500/10 to-sky-500/10 border border-primary/15 px-5 py-4">
              <span className="text-sm text-muted-foreground">{t.servicesSection.priceLabel}</span>
              <span className="text-2xl font-extrabold text-primary">{formatPrice(service.price)} <span className="text-sm font-medium text-primary/70">{"so'm"}</span></span>
            </div>

            <button
              onClick={onBook}
              className="group/book mt-6 flex items-center gap-4 text-left"
            >
              <span className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 group-hover/book:scale-110 transition-transform">
                <ArrowUpRight className="w-6 h-6 group-hover/book:rotate-45 transition-transform" />
              </span>
              <span className="font-bold text-lg">{t.servicesSection.book}</span>
            </button>
          </div>

          {/* Right — auto-scrolling process gallery */}
          <div className="relative bg-[#081d3f] overflow-hidden min-h-[300px] md:min-h-full">
            <div className="absolute top-5 left-5 z-10 mono text-[10px] tracking-[0.3em] text-sky-300/70">{t.servicesSection.galleryLabel.toUpperCase()}</div>
            <div className="marquee-y absolute inset-x-0 top-0 flex flex-col gap-4 p-6 pt-14">
              {[...galleryTiles, ...galleryTiles].map((g, gi) => (
                <div
                  key={gi}
                  className="relative h-44 rounded-2xl overflow-hidden shrink-0"
                  style={{
                    background: `linear-gradient(135deg, hsl(${190 + g * 12} 60% ${28 + g * 6}%), hsl(${174} 62% ${20 + g * 5}%))`,
                  }}
                >
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                  <div className="absolute left-5 bottom-4">
                    <div className="mono text-[10px] tracking-[0.25em] text-white/60">{pad2((g % galleryTiles.length) + 1)} / {t.servicesSection.galleryLabel.toUpperCase()}</div>
                  </div>
                  {/* mini rotating tooth */}
                  <svg viewBox="0 0 200 200" fill="none" className="absolute right-4 top-4 w-14 h-14 opacity-70" style={{ animation: 'spin-slow 14s linear infinite' }}>
                    <path d={TOOTH_PATH} fill="white" opacity="0.9" />
                    <path d={SWOOSH_PATH} stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#081d3f] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#081d3f] to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════ Service icons (realistic tooth outline + per-service accent) ══════════ */
function getServiceIcon(nameUz: string) {
  // Accent marks drawn on top of the realistic tooth (200×200 space)
  const accents: Record<string, JSX.Element> = {
    // Filling — a filled cavity dot on the crown
    'Tish plomba': <circle cx="100" cy="88" r="9" fill="currentColor" stroke="none" />,
    // Treatment — a plus/medical cross on the crown
    'Tishni davolash': <path d="M100 76 V104 M86 90 H114" strokeWidth="8" />,
    // Extraction — an X marking removal
    'Tish olish': <path d="M84 74 L116 112 M116 74 L84 112" strokeWidth="8" />,
    // Implant — a screw post below the crown
    'Implantatsiya': <path d="M100 92 V150 M88 108 H112 M90 124 H110 M92 140 H108" strokeWidth="7" />,
  };
  const accent = accents[nameUz];
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d={TOOTH_PATH} />
      {accent}
    </svg>
  );
}

/* ══════════ Services section (accordion + cursor preview + modal) ══════════ */
function ServicesSection({
  services, loadingServices, lang, t, onBook,
}: {
  services: ServicePrice[];
  loadingServices: boolean;
  lang: Lang;
  t: (typeof translations)['uz'];
  onBook: () => void;
}) {
  const [hovered, setHovered] = useState<{ s: ServicePrice; i: number } | null>(null);
  const [modal, setModal] = useState<{ s: ServicePrice; i: number } | null>(null);
  // On touch devices there is no hover — the row scrolled to the centre of the
  // viewport becomes "active" (3D + glow), so depth is felt while scrolling.
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || typeof window === 'undefined') return;
    // Only drive scroll-activation where hover is unavailable (phones/tablets)
    if (!window.matchMedia('(hover: none)').matches) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId((e.target as HTMLElement).dataset.svcId || null);
        }
      },
      // fire only while a row crosses the central band of the screen → one active at a time
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    rowRefs.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [services, reduced]);

  const serviceName = useCallback(
    (s: ServicePrice) => (lang === 'uz' ? s.nameUz : lang === 'ru' ? s.nameRu : s.nameEn),
    [lang]
  );

  // per-row 3D tilt + spotlight that tracks the cursor inside the hovered row
  const onRowMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;   // 0..1
    el.style.setProperty('--rx', ((0.5 - py) * 7).toFixed(2) + 'deg');
    el.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  }, [reduced]);

  const onRowReset = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  return (
    <section id="services" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
            <span className="mono text-[11px] font-bold uppercase tracking-[0.3em] text-sky-700">{t.servicesSection.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">{t.servicesSection.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.servicesSection.subtitle}</p>
        </div>

        {/* Accordion list */}
        {services.length > 0 ? (
          <div ref={listRef} className="svc-list border-t border-border/60">
            {services.map((service, i) => {
              const [kwA, kwB] = getKeywords(service.nameUz, i);
              const isOpen = hovered?.s.id === service.id || activeId === service.id;
              return (
                <div
                  key={service.id}
                  data-svc-id={service.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(service.id, el);
                    else rowRefs.current.delete(service.id);
                  }}
                  className={`svc-row group border-b border-border/60 cursor-pointer ${isOpen ? 'open' : ''}`}
                  onMouseEnter={() => setHovered({ s: service, i })}
                  onMouseMove={onRowMove}
                  onMouseLeave={(e) => { onRowReset(e); setHovered((h) => (h?.s.id === service.id ? null : h)); }}
                  onClick={() => setModal({ s: service, i })}
                >
                  <div className="svc-fill rounded-2xl" />
                  <div className="svc-spot rounded-2xl" />
                  <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-6 px-3 sm:px-6 py-5 sm:py-7 transition-colors duration-500 group-[.open]:text-white">
                    <span className="mono text-xs sm:text-sm text-primary/60 group-[.open]:text-sky-300 transition-colors w-6 sm:w-8 shrink-0">{pad2(i + 1)}</span>

                    <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary group-[.open]:bg-white/10 group-[.open]:text-sky-300 transition-colors shrink-0">
                      {getServiceIcon(service.nameUz)}
                    </div>

                    <h3 className="text-lg sm:text-2xl font-bold tracking-tight min-w-0 flex-1 truncate">{serviceName(service)}</h3>

                    {/* keywords — desktop only */}
                    <div className="hidden lg:flex items-center gap-3 ml-2 flex-1">
                      <span className="svc-keyword mono text-[10px] tracking-[0.25em] text-sky-300/80">{kwA}</span>
                      <span className="svc-keyword w-1 h-1 rounded-full bg-sky-300/50" />
                      <span className="svc-keyword mono text-[10px] tracking-[0.25em] text-sky-300/80">{kwB}</span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-auto">
                      <div className="text-right">
                        <span className="text-sm sm:text-lg font-bold whitespace-nowrap">{formatPrice(service.price)}</span>
                        <span className="text-[10px] sm:text-xs opacity-70 ml-1">{"so'm"}</span>
                      </div>
                      <span className="svc-mark flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-current/20 group-[.open]:border-sky-300/40 group-[.open]:bg-sky-400/10 shrink-0">
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : loadingServices ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="mono-blink mono text-sm tracking-[0.3em] text-muted-foreground">{t.servicesSection.loading}...</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="mono text-sm tracking-[0.3em] text-muted-foreground">{t.servicesSection.subtitle}</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ServiceModal
          service={modal.s}
          index={modal.i}
          lang={lang}
          t={t}
          onClose={() => setModal(null)}
          onBook={() => { setModal(null); onBook(); }}
        />
      )}
    </section>
  );
}

/* ══════════ Testimonials (happy clients) ══════════ */
function TestimonialsSection({ t }: { t: (typeof translations)['uz'] }) {
  const items = t.testimonials.items;
  const avatarGradients = [
    'from-sky-500 to-sky-600',
    'from-sky-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ];
  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const reduced = usePrefersReducedMotion();

  // cursor-tracking 3D tilt + spotlight per card
  const onCardMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
    el.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(2) + 'deg');
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  }, [reduced]);

  const onCardReset = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  // duplicate the list so the marquee can loop seamlessly
  const loop = [...items, ...items];

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-sky-400/8 rounded-full blur-3xl animate-morph" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-sky-400/8 rounded-full blur-3xl animate-morph" style={{ animationDelay: '4s' }} />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
              <Star className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
              <span className="mono text-[11px] font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-400">{t.testimonials.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">{t.testimonials.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.testimonials.subtitle}</p>
          </div>
        </div>

        {/* Auto-scrolling marquee (pauses on hover), edge-faded */}
        <div
          className="relative reveal"
          style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}
        >
          <div className="marquee-x tcard-stage flex gap-6 px-3">
            {loop.map((item, i) => (
              <div
                key={i}
                onMouseMove={onCardMove}
                onMouseLeave={onCardReset}
                className="tcard group relative w-[300px] sm:w-[360px] shrink-0 rounded-3xl bg-card border border-border/50 p-7 shadow-lg overflow-hidden"
              >
                {/* cursor spotlight sheen */}
                <div className="tcard-spot pointer-events-none absolute inset-0 rounded-3xl" />
                {/* hover glow */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-sky-400/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* big quotation mark */}
                <div className="relative text-6xl leading-none font-serif text-sky-500/20 mb-1 select-none">&ldquo;</div>

                {/* stars */}
                <div className="relative flex gap-0.5 mb-4">
                  {Array.from({ length: item.rating }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <p className="relative text-[15px] leading-relaxed text-foreground/85 mb-6">{item.text}</p>

                <div className="relative flex items-center gap-3">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} text-white font-bold text-sm shadow-md`}>
                    {initials(item.name)}
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-sky-500 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════ Features — cards fly in from scattered 3D positions, re-triggers every scroll-in ══════════ */
function FeaturesSection({ t }: { t: (typeof translations)['uz'] }) {
  const featureIcons = [Sparkles, Award, Heart, Shield];
  const gradients = [
    'from-sky-500 to-sky-600',
    'from-sky-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
  ];
  const blobColors = ['bg-sky-400/20', 'bg-sky-400/20', 'bg-violet-400/20', 'bg-rose-400/20'];
  // scattered start transform per card — each from a different side, with 3D tilt + spin
  const scatter = [
    'translate3d(-140px, -110px, -260px) rotateX(38deg) rotateY(-34deg) rotate(-14deg)',
    'translate3d(150px, -95px, -300px) rotateX(32deg) rotateY(34deg) rotate(12deg)',
    'translate3d(-130px, 120px, -280px) rotateX(-34deg) rotateY(-28deg) rotate(10deg)',
    'translate3d(160px, 130px, -320px) rotateX(-38deg) rotateY(30deg) rotate(-11deg)',
  ];

  const gridRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">{t.features.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.features.subtitle}</p>
        </div>

        <div ref={gridRef} className="feat-stage grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.features.items.map((item, i) => {
            const Icon = featureIcons[i];
            const settled = inView || reduced;
            return (
              <div
                key={i}
                className="feat-card-wrap"
                style={{
                  transform: settled ? 'none' : scatter[i],
                  opacity: settled ? 1 : 0,
                  transitionDelay: settled ? `${i * 130}ms` : '0ms',
                }}
              >
                <div className="group relative h-full bg-card rounded-2xl p-8 shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 text-center overflow-hidden">
                  <div className={`pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full ${blobColors[i]} blur-2xl blob-drift opacity-0 group-hover:opacity-100 transition-opacity duration-700`} style={{ animationDelay: `${i * 0.6}s` }} />

                  <span className="relative mono text-xs font-bold tracking-[0.2em] text-sky-700/70">({pad2(i + 1)})</span>
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${gradients[i]} flex items-center justify-center mx-auto my-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="relative font-bold text-lg mb-3">{item.title}</h3>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════ Animated 3D text input — each typed letter flies in ══════════
   The real <input> stays fully functional (it owns the value & caret) but its
   text is transparent; an overlay renders every character, and each newly typed
   character mounts with a 3D fly-in from a random direction. Characters are
   keyed by a stable id so already-typed letters never re-animate. */
type AnimChar = { id: number; ch: string; dx: number; dy: number; rx: number; ry: number };

function Animated3DInput({
  id, value, onChange, onFocus, placeholder, type = 'text', inputMode, prefix, transform,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  placeholder: string;
  type?: string;
  inputMode?: 'text' | 'tel';
  prefix?: string;          // static, always-visible leading text (e.g. "+998")
  transform?: (raw: string) => string;  // format the raw input before display/animation
}) {
  const [chars, setChars] = useState<AnimChar[]>([]);
  const idRef = useRef(0);
  const reduced = usePrefersReducedMotion();

  // Build the char list for `val`: keep the unchanged prefix (so those letters
  // keep their id and don't re-animate) and give every new letter a fresh id +
  // a random incoming vector.
  const buildChars = (prev: AnimChar[], val: string) => {
    const next: AnimChar[] = [];
    for (let i = 0; i < val.length; i++) {
      if (prev[i] && prev[i].ch === val[i]) {
        next.push(prev[i]);
        continue;
      }
      const ang = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 28;
      next.push({
        id: (idRef.current += 1),
        ch: val[i],
        dx: Math.round(Math.cos(ang) * dist),
        dy: Math.round(Math.sin(ang) * dist),
        rx: Math.round((Math.random() - 0.5) * 150),
        ry: Math.round((Math.random() - 0.5) * 150),
      });
    }
    return next;
  };

  // Keep the overlay in sync when `value` is changed from the outside
  // (e.g. the form is reset to '' after a successful booking) — without this
  // the animated letters would linger after the field is cleared.
  useEffect(() => {
    setChars((prev) => (prev.map((c) => c.ch).join('') === value ? prev : buildChars(prev, value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const reconcile = (raw: string) => {
    const val = transform ? transform(raw) : raw;
    setChars((prev) => buildChars(prev, val));
    onChange(val);
  };

  return (
    <div className="anim-input-wrap">
      {prefix ? <span className="anim-prefix">{prefix}</span> : null}
      <div className="anim-field">
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onFocus={onFocus}
        onChange={(e) => reconcile(e.target.value)}
        className="anim-input-real"
        autoComplete="off"
      />
      <div className="anim-input-overlay" aria-hidden="true">
        {chars.length === 0 ? (
          <span className="anim-placeholder">{placeholder}</span>
        ) : (
          chars.map((c) => (
            <span
              key={c.id}
              className="anim-char"
              style={reduced ? undefined : {
                ['--dx' as string]: `${c.dx}px`,
                ['--dy' as string]: `${c.dy}px`,
                ['--crx' as string]: `${c.rx}deg`,
                ['--cry' as string]: `${c.ry}deg`,
              }}
            >
              {c.ch === ' ' ? ' ' : c.ch}
            </span>
          ))
        )}
      </div>
      </div>
    </div>
  );
}

/* ══════════════════════ MAIN PAGE ══════════════════════ */
export default function HomePage() {
  const [lang, setLang] = useState<Lang>('uz');
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialty?: string | null }>>([]);
  const [bookingForm, setBookingForm] = useState({ patientName: '', patientPhone: '', doctorId: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  // Submit tugmasi e'tibor tortib tebranib turadi; foydalanuvchi formaga yozishga kirishsa to'xtaydi
  const [bookingTouched, setBookingTouched] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [bookingMorphed, setBookingMorphed] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

  const bookingHeadRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const heroTiltRef = useRef<HTMLDivElement>(null);
  const heroReduced = usePrefersReducedMotion();

  // hero 3D parallax tilt following the cursor (ref-based, no re-render)
  const onHeroMove = (e: React.MouseEvent<HTMLElement>) => {
    if (heroReduced) return;
    const el = heroTiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--hx', ((0.5 - py) * 7).toFixed(2) + 'deg');
    el.style.setProperty('--hy', ((px - 0.5) * 9).toFixed(2) + 'deg');
  };
  const onHeroLeave = () => {
    const el = heroTiltRef.current;
    if (!el) return;
    el.style.setProperty('--hx', '0deg');
    el.style.setProperty('--hy', '0deg');
  };

  // close doctor dropdown on outside click / Esc
  useEffect(() => {
    if (!docOpen) return;
    const onDown = (e: MouseEvent) => {
      if (docRef.current && !docRef.current.contains(e.target as Node)) setDocOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDocOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [docOpen]);

  useGlobalReveal();

  const t = translations[lang];
  const st = sectionsI18n[lang];
  const revealUI = phase === 'out' || phase === 'done';

  // Cinematic intro sequence (session-scoped)
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem('kdc_intro_v1'); } catch { seen = false; }
    if (seen) { setPhase('done'); return; }
    setPhase('loading');
    const timers = [
      setTimeout(() => setPhase('brand'), 1650),
      setTimeout(() => setPhase('out'), 3050),
      setTimeout(() => {
        setPhase('done');
        try { sessionStorage.setItem('kdc_intro_v1', '1'); } catch { /* ignore */ }
      }, 3700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // navbar glass on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // booking headline morph on scroll-in
  useEffect(() => {
    const el = bookingHeadRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setBookingMorphed(true); },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // data
  useEffect(() => {
    fetch(`${API_URL}/public/services`).then((r) => r.json()).then((d) => {
      if (d.success) setServices(d.data);
    }).catch(() => {}).finally(() => setLoadingServices(false));
    fetch(`${API_URL}/public/doctors`).then((r) => r.json()).then((d) => {
      if (d.success) setDoctors(d.data);
    }).catch(() => {});
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientName || !bookingForm.patientPhone || !bookingForm.doctorId) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    setBookingLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t.booking.success);
        // barcha maydonlarni tozalash + tugma yana e'tibor tortib teb­ransin
        setBookingForm({ patientName: '', patientPhone: '', doctorId: '' });
        setBookingTouched(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setBookingLoading(false);
    }
  };

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const serviceName = (s: ServicePrice) => (lang === 'uz' ? s.nameUz : lang === 'ru' ? s.nameRu : s.nameEn);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ═══ GLOBAL ANIMATED BACKGROUND ═══ */}
      <SiteBackground />

      {/* ═══ CINEMATIC PRELOADER ═══ */}
      {phase !== 'idle' && phase !== 'done' && <Preloader phase={phase} t={t} />}

      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-lg shadow-black/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className={`flex items-center gap-2.5 ${revealUI ? 'nav-drop' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
              <MorphingLogo />
              <div>
                <span className="text-lg font-bold tracking-tight" style={{ color: '#0c2d5a' }}>Kamoliddin</span>
                <span className="hidden sm:block mono text-[9px] uppercase tracking-[0.22em] font-semibold -mt-0.5" style={{ color: '#0ea5e9' }}>Dental Clinic</span>
              </div>
            </div>

            {/* Desktop nav links */}
            <div className={`hidden md:flex items-center gap-8 ${revealUI ? 'nav-drop' : 'opacity-0'}`} style={{ animationDelay: '0.15s' }}>
              <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">{t.nav.services}</a>
              <a href="#doctors" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">{st.navDoctors}</a>
              <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">{t.nav.about}</a>
              <a href="#booking" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">{t.nav.booking}</a>
            </div>

            {/* Right side */}
            <div className={`flex items-center gap-3 ${revealUI ? 'nav-drop' : 'opacity-0'}`} style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center bg-muted/60 backdrop-blur-sm rounded-full p-1 border border-border/50">
                {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    aria-label={l === 'uz' ? "O'zbekcha" : l === 'ru' ? 'Русский' : 'English'}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                      lang === l
                        ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? "Yorug' rejim" : 'Tungi rejim'}
                className="theme-toggle relative flex items-center justify-center w-9 h-9 rounded-full bg-muted/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors overflow-hidden"
              >
                <Sun className={`w-[18px] h-[18px] absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                <Moon className={`w-[18px] h-[18px] absolute transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              </button>
              <Link href="/login" className="hidden sm:block">
                <Button size="sm" className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg shadow-sky-500/20 border-0 font-semibold">
                  {t.nav.login}
                </Button>
              </Link>
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                aria-label={mobileMenu ? 'Menyuni yopish' : 'Menyuni ochish'}
                aria-expanded={mobileMenu}
                aria-controls="mobile-menu"
                className="md:hidden p-2 rounded-lg hover:bg-muted transition"
              >
                {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenu && (
          <div id="mobile-menu" className="md:hidden glass border-t border-border/50 animate-in slide-in-from-top-2">
            <div className="px-4 py-4 space-y-1">
              {[
                { href: '#services', label: t.nav.services },
                { href: '#doctors', label: st.navDoctors },
                { href: '#about', label: t.nav.about },
                { href: '#booking', label: t.nav.booking },
              ].map((item, i) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="m-item flex items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-foreground/90 hover:text-primary hover:bg-primary/5 active:scale-[0.98] transition"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {item.label}
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </a>
              ))}
              <button
                onClick={toggleTheme}
                className="m-item flex items-center gap-2 w-full rounded-xl px-3 py-3 text-base font-semibold text-foreground/90 hover:text-primary hover:bg-primary/5 active:scale-[0.98] transition"
                style={{ animationDelay: '180ms' }}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {theme === 'dark' ? "Yorug' rejim" : 'Tungi rejim'}
              </button>
              <Link href="/login" className="m-item block pt-2" style={{ animationDelay: '240ms' }} onClick={() => setMobileMenu(false)}>
                <Button className="booking-wiggle w-full h-12 text-base font-bold bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg shadow-sky-500/25 border-0 rounded-2xl">{t.nav.login}</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section onMouseMove={onHeroMove} onMouseLeave={onHeroLeave} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-sky-400/8 via-sky-300/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-400/6 via-sky-300/4 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-sky-400/30 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/4 right-1/3 w-3 h-3 rounded-full bg-sky-400/20 animate-float-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-sky-400/25 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0 w-full">
          <div ref={heroTiltRef} className="hero-tilt grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Text */}
            <div className={`hero-layer-text max-w-xl transition-all duration-1000 ${revealUI ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/15 mb-8">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-sm font-medium text-sky-700">{t.hero.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1] mb-5">
                {t.hero.title1}{' '}
                <span className="gradient-text">{t.hero.titleHighlight}</span>
                {' '}
                {t.hero.title2}
              </h1>

              {/* Monospace scramble slogan */}
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary/40" />
                <ScrambleText
                  text={t.hero.slogan}
                  start={revealUI}
                  className="mono text-[11px] sm:text-xs tracking-[0.25em] text-sky-700 font-medium"
                />
              </div>

              <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">{t.hero.subtitle}</p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a href="#booking" className="group/cta relative">
                  <Button size="lg" className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-xl shadow-sky-500/25 border-0 rounded-2xl group">
                    <Calendar className="w-5 h-5 mr-2 group-hover:animate-wiggle" />
                    {t.hero.cta}
                  </Button>
                  <RotatingBadge label={t.hero.tap} />
                </a>
                <a href="#services">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold rounded-2xl border-2 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                    {t.hero.secondary}
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Right: Animated Tooth + particles */}
            <div className={`hero-layer-art transition-all duration-1000 delay-300 ${revealUI ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <ToothHero />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative -mt-4 z-10 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { value: 2000, suffix: '+', label: t.stats.patients, icon: Heart, color: 'from-rose-500 to-pink-600' },
              { value: 10, suffix: '+', label: t.stats.experience, icon: Award, color: 'from-amber-500 to-orange-600' },
              { value: 10, suffix: '+', label: t.stats.services, icon: Star, color: 'from-sky-500 to-sky-600' },
              { value: 5, suffix: '+', label: t.stats.doctors, icon: Shield, color: 'from-violet-500 to-purple-600' },
            ].map((stat, i) => (
              // Reveal on the outer wrapper; tilt/hover on the inner card — keeps the
              // stagger delay and reveal fade from colliding with the 3D-tilt transition.
              <div key={i} className={`reveal delay-${(i + 1) * 100}`}>
                <TiltCard className="group relative h-full bg-card rounded-2xl p-6 shadow-lg shadow-black/5 border border-border/50 hover:shadow-xl transition-shadow duration-400">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <ServicesSection services={services} loadingServices={loadingServices} lang={lang} t={t} onBook={scrollToBooking} />

      {/* ═══ FEATURES ═══ */}
      <FeaturesSection t={t} />

      {/* ═══ TESTIMONIALS ═══ */}
      <TestimonialsSection t={t} />

      {/* ═══ DOCTORS (Mutaxassislarimiz) ═══ */}
      {doctors.length > 0 && (
        <section id="doctors" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 reveal">
              <span className="mono text-[11px] font-bold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-400">{st.docBadge}</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 mt-2">{st.docTitle}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{st.docSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctors.map((doc) => (
                <div key={doc.id} className="reveal-scale group rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50 p-6 text-center shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-sky-500/25 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {doc.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-lg">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{doc.specialty || st.docRole}</p>
                  <Button
                    onClick={() => { setBookingForm((f) => ({ ...f, doctorId: doc.id })); scrollToBooking(); }}
                    variant="outline"
                    className="w-full gap-1.5 border-sky-200 dark:border-sky-900/50 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-700 dark:hover:text-sky-300"
                  >
                    <Calendar className="h-4 w-4" />
                    {st.docBook}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BOOKING ═══ */}
      <section id="booking" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-sky-500/3 to-sky-500/5" />
        <div className="absolute top-20 right-20 w-40 h-40 bg-sky-400/10 rounded-full blur-3xl animate-morph" />
        <div className="absolute bottom-20 left-20 w-56 h-56 bg-sky-400/8 rounded-full blur-3xl animate-morph" style={{ animationDelay: '4s' }} />

        <div className="absolute top-1/4 left-10 opacity-[0.06] animate-float-slow" style={{ animationDelay: '1s' }}>
          <svg viewBox="0 0 200 200" className="w-24 h-24" fill="none">
            <circle cx="100" cy="100" r="72" stroke="#0c2d5a" strokeWidth="6" fill="none" />
            <path d={TOOTH_PATH} stroke="#0ea5e9" strokeWidth="5" fill="none" />
          </svg>
        </div>
        <div className="absolute bottom-1/4 right-16 opacity-[0.04] animate-float" style={{ animationDelay: '3s' }}>
          <svg viewBox="0 0 200 200" className="w-32 h-32 rotate-12" fill="none">
            <circle cx="100" cy="100" r="72" stroke="#0c2d5a" strokeWidth="5" fill="none" />
            <path d={TOOTH_PATH} stroke="#0ea5e9" strokeWidth="4" fill="none" />
          </svg>
        </div>

        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={bookingHeadRef} className="text-center mb-10">
            <p className="mono text-[11px] tracking-[0.35em] text-primary/70 mb-4">{t.booking.kicker}</p>
            {/* Morphing headline */}
            <div className={`morph-wrap justify-center ${bookingMorphed ? 'morphed' : ''}`}>
              <span className="morph-from text-3xl sm:text-5xl font-extrabold tracking-tight text-muted-foreground">{t.booking.morphFrom}</span>
              <span className="morph-to text-4xl sm:text-6xl font-extrabold tracking-tight gradient-text">{t.booking.morphTo}</span>
            </div>
            <p className="text-lg text-muted-foreground mt-4">{t.booking.subtitle}</p>
          </div>

          <div className="reveal-scale">
            <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-sky-500/10 border border-border/50 p-8 sm:p-10">
              <form onSubmit={handleBooking} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="booking-name" className="text-sm font-semibold">{t.booking.name}</Label>
                  <div className="field-3d px-4">
                    <User className="field-icon w-5 h-5 shrink-0" />
                    <Animated3DInput
                      id="booking-name"
                      placeholder={t.booking.name}
                      value={bookingForm.patientName}
                      onFocus={() => setBookingTouched(true)}
                      onChange={(v) => setBookingForm((f) => ({ ...f, patientName: v }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-phone" className="text-sm font-semibold">{t.booking.phone}</Label>
                  <div className="field-3d px-4">
                    <Phone className="field-icon w-5 h-5 shrink-0" />
                    <Animated3DInput
                      id="booking-phone"
                      type="tel"
                      inputMode="tel"
                      prefix="+998"
                      placeholder="90 123 45 67"
                      transform={formatPhoneNational}
                      value={bookingForm.patientPhone.replace(/^\+998\s?/, '')}
                      onFocus={() => setBookingTouched(true)}
                      onChange={(v) => setBookingForm((f) => ({ ...f, patientPhone: v ? `+998 ${v}` : '' }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-doctor" className="text-sm font-semibold">{t.booking.doctor}</Label>
                  <div ref={docRef} className="doc-select relative">
                    {/* Trigger */}
                    <button
                      type="button"
                      id="booking-doctor"
                      onClick={() => { setBookingTouched(true); setDocOpen((o) => !o); }}
                      aria-haspopup="listbox"
                      aria-expanded={docOpen}
                      className={`field-3d px-4 w-full text-left ${docOpen ? 'doc-trigger-open' : ''}`}
                    >
                      <Stethoscope className="field-icon w-5 h-5 shrink-0" />
                      {(() => {
                        const sel = doctors.find((d) => d.id === bookingForm.doctorId);
                        return sel ? (
                          // key on the selected id → remounts on every pick so the
                          // 3D fly-in animation replays each time a doctor is chosen
                          <span key={sel.id} className="doc-selected pl-3 flex items-center gap-2 min-w-0">
                            <span className="doc-avatar doc-avatar-sm doc-sel-avatar">{sel.name.charAt(0)}</span>
                            <span className="truncate font-medium">{sel.name}</span>
                          </span>
                        ) : (
                          <span className="pl-3 text-muted-foreground/60">{t.booking.selectDoctor}</span>
                        );
                      })()}
                      <ChevronDown className={`field-icon w-4 h-4 shrink-0 absolute right-4 transition-transform duration-300 ${docOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Animated panel */}
                    {docOpen && (
                      <div className="doc-panel" role="listbox">
                        {doctors.length === 0 && (
                          <div className="doc-empty">…</div>
                        )}
                        {doctors.map((d, i) => {
                          const active = d.id === bookingForm.doctorId;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              role="option"
                              aria-selected={active}
                              onClick={() => { setBookingForm((f) => ({ ...f, doctorId: d.id })); setDocOpen(false); }}
                              className={`doc-option ${active ? 'doc-option-active' : ''}`}
                              style={{ animationDelay: `${i * 55}ms` }}
                            >
                              <span className="doc-avatar">{d.name.charAt(0)}</span>
                              <span className="truncate font-medium flex-1 text-left">{d.name}</span>
                              <span className={`doc-check ${active ? 'doc-check-on' : ''}`}>
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full h-14 text-base font-bold bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-xl shadow-sky-500/25 border-0 rounded-2xl ${!bookingTouched && !bookingLoading ? 'booking-wiggle' : ''}`}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <DotsSpinner />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      {t.booking.submit}
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ APP DOWNLOAD (Ilovamizni yuklab oling) ═══ */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal-scale relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 p-8 sm:p-12 shadow-2xl shadow-sky-500/25">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-white">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">{st.appTitle}</h2>
                <p className="text-white/85 text-lg mb-8 max-w-md">{st.appSubtitle}</p>
                <div className="flex flex-wrap gap-4">
                  <a href="#" className="flex items-center gap-3 rounded-2xl bg-white/15 backdrop-blur px-5 py-3 border border-white/20 hover:bg-white/25 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    <div className="text-left"><div className="text-[10px] text-white/70">{st.appStoreTop}</div><div className="font-bold text-white leading-tight">App Store</div></div>
                  </a>
                  <a href="#" className="flex items-center gap-3 rounded-2xl bg-white/15 backdrop-blur px-5 py-3 border border-white/20 hover:bg-white/25 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden="true"><path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1L13 12.1v-.2L3.6 2.3zm12.8 13.2l-2.6-2.6 3.2-3.2 3.1 1.8c.9.5.9 1.4 0 1.9l-3.7 2.1zM4.4 3.2l8.9 5.1-2.5 2.5L4.4 3.2zm6.4 8.8l-6.4 6.4 8.9-5.1-2.5-1.3z"/></svg>
                    <div className="text-left"><div className="text-[10px] text-white/70">{st.googlePlayTop}</div><div className="font-bold text-white leading-tight">Google Play</div></div>
                  </a>
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <div className="rounded-2xl bg-white p-4 shadow-xl">
                  <div className="w-40 h-40 rounded-lg" style={{ backgroundImage: 'repeating-conic-gradient(#0c2d5a 0% 25%, #ffffff 0% 50%)', backgroundSize: '20px 20px' }} aria-hidden="true" />
                  <p className="text-center text-[#0c2d5a] text-xs font-semibold mt-2 mono tracking-widest">SCAN QR</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative bg-gradient-to-b from-background to-[#081d3f] overflow-hidden">
        {/* Animated wave separator across the top */}
        <div className="pointer-events-none absolute top-0 inset-x-0 -translate-y-[98%] overflow-hidden leading-none h-16 sm:h-20">
          <svg className="footer-wave relative block h-full w-[200%]" viewBox="0 0 2880 120" preserveAspectRatio="none" fill="none">
            <path d="M0 60 C 240 110 480 10 720 60 C 960 110 1200 10 1440 60 C 1680 110 1920 10 2160 60 C 2400 110 2640 10 2880 60 L2880 120 L0 120 Z" fill="#081d3f" fillOpacity="0.5" />
          </svg>
          <svg className="footer-wave-2 absolute top-0 left-0 block h-full w-[200%]" viewBox="0 0 2880 120" preserveAspectRatio="none" fill="none">
            <path d="M0 70 C 240 30 480 110 720 70 C 960 30 1200 110 1440 70 C 1680 30 1920 110 2160 70 C 2400 30 2640 110 2880 70 L2880 120 L0 120 Z" fill="#081d3f" />
          </svg>
        </div>

        {/* Glowing top edge with sweeping highlight */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent overflow-hidden">
          <div className="footer-glow-sweep absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
        </div>

        {/* Rising tooth / bubble particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 200 200"
              fill="none"
              className="footer-rise absolute bottom-0 text-sky-400/40"
              style={{
                left: `${6 + i * 9.3}%`,
                width: `${16 + (i % 4) * 8}px`,
                height: `${16 + (i % 4) * 8}px`,
                animationDuration: `${11 + (i % 5) * 3}s`,
                animationDelay: `${i * 1.4}s`,
              }}
            >
              <path d={TOOTH_PATH} fill="currentColor" />
            </svg>
          ))}
        </div>

        {/* Giant watermark */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden select-none">
          <span className="wm-text text-[26vw] leading-none translate-y-[18%]">KDC</span>
        </div>
        {/* Parallax clinic backdrop (CSS-generated architectural gradient) */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div
            className="slow-zoom absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(180deg, transparent 55%, #0c2d5a 100%), repeating-linear-gradient(90deg, rgba(14, 165, 233,0.4) 0px, rgba(14, 165, 233,0.4) 2px, transparent 2px, transparent 60px), repeating-linear-gradient(0deg, rgba(14, 165, 233,0.25) 0px, rgba(14, 165, 233,0.25) 2px, transparent 2px, transparent 60px)',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 shrink-0 animate-float"><LogoVariant variant={0} /></div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-white">Kamoliddin</span>
                  <span className="block mono text-[9px] uppercase tracking-[0.22em] font-semibold text-sky-400">Dental Clinic</span>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                {t.footer.tagline}. Kamoliddin Dental Clinic — {t.hero.badge.toLowerCase()}.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-5 text-white">{t.contact.title}</h4>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-white/60 group">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                    <MapPin className="w-4 h-4 text-sky-400" />
                  </div>
                  {t.contact.address}
                </div>
                <div className="flex items-center gap-3 text-white/60 group">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                    <Phone className="w-4 h-4 text-sky-400" />
                  </div>
                  +998 90 123 45 67
                </div>
                <div className="flex items-center gap-3 text-white/60 group">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                    <Clock className="w-4 h-4 text-sky-400" />
                  </div>
                  {t.contact.workHours}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-5 text-white">{t.nav.services}</h4>
              <div className="space-y-2.5 text-sm text-white/60">
                {services.slice(0, 6).map((s) => (
                  <p key={s.id} className="flex items-center gap-2 hover:text-sky-400 hover:translate-x-1 transition-all duration-300 cursor-default">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400/50" />
                    {serviceName(s)}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p>&copy; 2026 KDC — Kamoliddin Dental Clinic. {t.footer.rights}.</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Made with</span>
              <Heart className="heartbeat w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="text-xs">by CodingTech</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
