'use client';

/**
 * DentalGuide — a friendly 3D-styled dentist mascot that guides the visitor
 * through the landing page. It sleeps in a corner on first load, wakes up when
 * the user starts scrolling, then "runs" to each section and explains it with a
 * different gesture. In the booking section it stands by the form and reacts to
 * the name / phone input, clapping when the appointment is submitted.
 *
 * Fully self-contained: it observes existing sections read-only and never
 * mutates the rest of the page. Styles live in globals.css (prefix: .dg-).
 */

import { useEffect, useRef, useState, useCallback } from 'react';

type Lang = 'uz' | 'ru' | 'en';

/* Gesture keys — one per section, deliberately varied */
type Gesture = 'wave' | 'present' | 'pointside' | 'thumbs' | 'heart' | 'form';

const SECTION_GESTURES: Gesture[] = ['wave', 'present', 'pointside', 'thumbs', 'heart', 'form'];

const SPEECH: Record<Lang, string[]> = {
  uz: [
    'Assalomu alaykum! 👋 Klinikamizga xush kelibsiz!',
    '2000+ mamnun bemor — mana bizning natijamiz!',
    'Zamonaviy xizmatlarimiz bilan tanishing 🦷',
    'Nega aynan biz? Mana sabablari 👍',
    'Bemorlar bizni juda yaxshi ko‘radi ❤️',
    'Keling, navbat olamiz! Ismingizni kiriting ✍️',
  ],
  ru: [
    'Здравствуйте! 👋 Добро пожаловать в нашу клинику!',
    '2000+ довольных пациентов — вот наш результат!',
    'Познакомьтесь с нашими современными услугами 🦷',
    'Почему именно мы? Вот причины 👍',
    'Пациенты нас очень любят ❤️',
    'Давайте запишемся! Введите ваше имя ✍️',
  ],
  en: [
    'Hello! 👋 Welcome to our clinic!',
    '2000+ happy patients — that’s our result!',
    'Discover our modern services 🦷',
    'Why choose us? Here are the reasons 👍',
    'Patients really love us ❤️',
    'Let’s book you in! Enter your name ✍️',
  ],
};

/* Booking-only reactive lines, keyed by mood level */
const BOOKING_LINES: Record<Lang, [string, string, string, string]> = {
  uz: [
    'Keling, navbat olamiz! Ismingizni kiriting ✍️',
    'Zo‘r! Endi telefon raqamingizni yozing 📱',
    'Ajoyib! Shifokorni tanlab, tasdiqlang 🎉',
    'Rahmat! Navbatingiz qabul qilindi 👏',
  ],
  ru: [
    'Давайте запишемся! Введите ваше имя ✍️',
    'Отлично! Теперь введите номер телефона 📱',
    'Прекрасно! Выберите врача и подтвердите 🎉',
    'Спасибо! Ваша запись принята 👏',
  ],
  en: [
    'Let’s book you in! Enter your name ✍️',
    'Great! Now type your phone number 📱',
    'Perfect! Pick a doctor and confirm 🎉',
    'Thank you! Your appointment is booked 👏',
  ],
};

export default function DentalGuide({ lang = 'uz' }: { lang?: Lang }) {
  const [awake, setAwake] = useState(false);
  const [waking, setWaking] = useState(false);
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [hidden, setHidden] = useState(false); // manual dismiss
  const [lift, setLift] = useState(0); // px raised so it never overlaps the footer
  const [leftPx, setLeftPx] = useState(20); // horizontal corner — alternates per section

  // booking-section mood: 0 idle, 1 name filled, 2 phone filled, 3 submitted (clap)
  const [nameFilled, setNameFilled] = useState(false);
  const [phoneFilled, setPhoneFilled] = useState(false);
  const [clap, setClap] = useState(false);

  const sectionsRef = useRef<HTMLElement[]>([]);
  const footerRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef(0);
  const awakeRef = useRef(false);
  const clapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Discover the six landing sections without mutating them ── */
  useEffect(() => {
    const collect = () => {
      const hero = document.querySelector<HTMLElement>('section.min-h-screen');
      const stats = hero?.nextElementSibling as HTMLElement | null;
      const services = document.querySelector<HTMLElement>('#services');
      const features = document.querySelector<HTMLElement>('#about');
      const testimonials = document.querySelector<HTMLElement>('#testimonials');
      const booking = document.querySelector<HTMLElement>('#booking');
      const list = [hero, stats, services, features, testimonials, booking].filter(
        (el): el is HTMLElement => !!el,
      );
      sectionsRef.current = list;
      footerRef.current = document.querySelector<HTMLElement>('footer');
      return list.length >= 4;
    };
    // sections render on first paint, but retry a few times just in case
    if (!collect()) {
      let tries = 0;
      const id = setInterval(() => {
        if (collect() || ++tries > 20) clearInterval(id);
      }, 250);
      return () => clearInterval(id);
    }
  }, []);

  /* ── Scroll: wake on first scroll + pick the section at viewport centre ── */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;

        // Wake up the first time the visitor scrolls a little
        if (!awakeRef.current && y > 40) {
          awakeRef.current = true;
          setWaking(true);
          setTimeout(() => {
            setAwake(true);
            setWaking(false);
          }, 1150);
        }

        // Keep the guide above the footer: once the footer rises into the
        // guide's area, lift it by the overlap so it scrolls away with the
        // page instead of floating over the footer.
        const baseBottom = 16;
        const footer = footerRef.current;
        if (footer) {
          const fr = footer.getBoundingClientRect();
          const guideBottomY = window.innerHeight - baseBottom;
          const overlap = guideBottomY - fr.top;
          setLift(overlap > 0 ? overlap + 8 : 0);
        }

        const list = sectionsRef.current;
        if (!list.length) return;
        const mid = window.innerHeight * 0.55;
        let idx = activeRef.current;
        let found = -1;
        for (let i = 0; i < list.length; i++) {
          const r = list[i].getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) {
            found = i;
            break;
          }
        }
        if (found === -1) {
          // Past the booking section (i.e. over the footer) — do NOT follow into
          // the footer. Park the guide on the booking section, the final stop.
          const last = list.length - 1;
          if (activeRef.current !== last) {
            activeRef.current = last;
            setActive(last);
          }
          return;
        }
        if (found !== idx) {
          idx = found;
          activeRef.current = found;
          setActive(found);
          if (awakeRef.current) {
            setRunning(true);
            setRunKey((k) => k + 1);
            if (runTimer.current) clearTimeout(runTimer.current);
            runTimer.current = setTimeout(() => setRunning(false), 950);
          }
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ── Booking form reactions (event delegation, read-only) ── */
  useEffect(() => {
    const onInput = (e: Event) => {
      const el = e.target as HTMLInputElement | null;
      if (!el || !el.id) return;
      if (el.id === 'booking-name') setNameFilled(el.value.trim().length >= 2);
      if (el.id === 'booking-phone') setPhoneFilled(el.value.replace(/\D/g, '').length >= 9);
    };
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLElement | null;
      if (!form || !form.querySelector?.('#booking-name')) return;
      setClap(true);
      setNameFilled(false);
      setPhoneFilled(false);
      if (clapTimer.current) clearTimeout(clapTimer.current);
      clapTimer.current = setTimeout(() => setClap(false), 3600);
    };
    document.addEventListener('input', onInput, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('submit', onSubmit, true);
      if (clapTimer.current) clearTimeout(clapTimer.current);
    };
  }, []);

  /* ── Alternating corner: even sections on the right, odd on the left, so the
     guide runs across to the opposite side each time the section changes ── */
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const mobile = vw <= 640;
      const w = mobile ? 100 : 132;
      const m = mobile ? 10 : 20;
      let lp: number;
      if (!awake) {
        lp = m; // sleeping in the left corner
      } else if (active === 5 && !mobile) {
        lp = Math.max(24, vw / 2 - 460); // booking: parked beside the form (left)
      } else {
        lp = active % 2 === 0 ? vw - w - m : m; // even → right, odd → left
      }
      setLeftPx(lp);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [active, awake]);

  const dismiss = useCallback(() => setHidden(true), []);

  const atBooking = active === 5;
  const mood = clap ? 3 : phoneFilled ? 2 : nameFilled ? 1 : 0;

  // Which gesture the figure strikes
  let gesture: Gesture | 'happy1' | 'happy2' | 'clap' = SECTION_GESTURES[active] ?? 'wave';
  if (atBooking) {
    gesture = mood === 3 ? 'clap' : mood === 2 ? 'happy2' : mood === 1 ? 'happy1' : 'form';
  }

  const bubbleText = atBooking ? BOOKING_LINES[lang][mood] : SPEECH[lang][active] ?? '';

  const state = !awake ? (waking ? 'waking' : 'sleeping') : 'awake';

  const rootCls = [
    'dg-root',
    `dg-${state}`,
    atBooking ? 'dg-pos-booking' : awake ? 'dg-pos-corner' : 'dg-pos-sleep',
    hidden ? 'dg-hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const figureCls = [
    'dg-figure',
    `dg-g-${gesture}`,
    running ? 'dg-running' : '',
    !awake ? 'dg-asleep' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootCls}
      aria-hidden="true"
      style={{ bottom: 16 + lift, left: leftPx, right: 'auto' }}
    >
      {awake && bubbleText && (
        <div className="dg-bubble" key={`${active}-${mood}`}>
          {bubbleText}
          <span className="dg-bubble-tail" />
        </div>
      )}

      <div className={figureCls} key={runKey}>
        {/* Zzz while sleeping */}
        <div className="dg-zzz">
          <span>z</span>
          <span>z</span>
          <span>z</span>
        </div>

        {/* Legs (run when moving) */}
        <div className="dg-legs">
          <span className="dg-leg dg-leg-l">
            <span className="dg-shoe" />
          </span>
          <span className="dg-leg dg-leg-r">
            <span className="dg-shoe" />
          </span>
        </div>

        {/* Body / coat */}
        <div className="dg-body">
          <span className="dg-collar" />
          <span className="dg-badge">+</span>
          {/* little heart used in the testimonials gesture */}
          <span className="dg-heart-pop">❤</span>
        </div>

        {/* Arms — siblings of the body so they are never clipped */}
        <span className="dg-arm dg-arm-l">
          <span className="dg-hand" />
        </span>
        <span className="dg-arm dg-arm-r">
          <span className="dg-hand" />
          <span className="dg-mirror" />
        </span>

        {/* Head */}
        <div className="dg-head">
          <span className="dg-ear dg-ear-l" />
          <span className="dg-ear dg-ear-r" />
          <span className="dg-cap">
            <span className="dg-cap-band" />
            <span className="dg-cap-cross" />
          </span>
          <span className="dg-face">
            <span className="dg-brow dg-brow-l" />
            <span className="dg-brow dg-brow-r" />
            <span className="dg-eye dg-eye-l" />
            <span className="dg-eye dg-eye-r" />
            <span className="dg-blush dg-blush-l" />
            <span className="dg-blush dg-blush-r" />
            <span className="dg-mouth" />
          </span>
        </div>

        <div className="dg-shadow" />
      </div>

      {awake && (
        <button type="button" className="dg-close" onClick={dismiss} aria-label="Yopish">
          ×
        </button>
      )}
    </div>
  );
}
