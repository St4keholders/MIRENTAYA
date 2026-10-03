'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ARCHETYPES, ASSET_BASE, Archetype } from './archetypes';
import '@/app/stakeholders.css';

const FECHAS = [
  '12 ago', '13 ago', '14 ago', '18 ago', '19 ago', '20 ago', '21 ago', '24 ago', '25 ago',
  '26 ago', '27 ago', '28 ago', '31 ago', '1 sep', '2 sep', '3 sep', '4 sep', '7 sep', '8 sep', '9 sep',
  '10 sep', '11 sep', '14 sep', '15 sep', '16 sep', '17 sep', '18 sep', '21 sep', '22 sep', '23 sep',
  '24 sep', '25 sep', '28 sep', '1 oct', '2 oct', '5 oct', '6 oct', '7 oct', '8 oct', '9 oct', '13 oct',
  '14 oct', '15 oct', '16 oct', '19 oct', '20 oct', '21 oct', '22 oct', '23 oct', '26 oct'
];

const MES_MAP: Record<string, [number, string]> = {
  ago: [7, 'agosto'],
  sep: [8, 'septiembre'],
  oct: [9, 'octubre'],
};

const MESES_NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Force dark body theme while this landing is mounted
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    const prevOverflow = document.body.style.overflowX;
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#FFFFFF';
    document.body.style.overflowX = 'clip';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
      document.body.style.overflowX = prevOverflow;
    };
  }, []);

  // Modal Arquetipos state
  const [activeArchetype, setActiveArchetype] = useState<Archetype | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlaying, setModalPlaying] = useState(false);
  const [modalReversed, setModalReversed] = useState(false);

  // Modal Agendar state
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [agNombre, setAgNombre] = useState('');
  const [agCorreo, setAgCorreo] = useState('');
  const [agTel, setAgTel] = useState('');
  const [agMedio, setAgMedio] = useState<'llamada' | 'videollamada' | 'whatsapp'>('llamada');
  const [agDateSelected, setAgDateSelected] = useState<Date | null>(null);
  const [agHoraSelected, setAgHoraSelected] = useState('');
  const [agErr, setAgErr] = useState('');
  const [agSubmitting, setAgSubmitting] = useState(false);
  const [agDoneTxt, setAgDoneTxt] = useState('');

  // Calendar View State
  const [calViewDate, setCalViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Date Finder State
  const [cedInput, setCedInput] = useState('');
  const [finderResult, setFinderResult] = useState<{ html: string; hasResult: boolean }>({
    html: '<p class="finder__hint">Escríbelos y te digo tu fecha.</p>',
    hasResult: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Open / Close functions for Archetype modal
  const handleOpenCard = (index: number) => {
    const a = ARCHETYPES[index];
    setActiveArchetype(a);
    setModalReversed(false);
    setModalPlaying(false);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';

    // Play video after state update
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = ASSET_BASE + a.vid;
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        const p = videoRef.current.play();
        if (p) {
          p.catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(handleRevealInfo);
            }
          });
        }
      }
    }, 50);
  };

  const handleRevealInfo = () => {
    setModalPlaying(false);
    setModalReversed(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleCloseCard = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setModalOpen(false);
    setModalPlaying(false);
    setModalReversed(false);
    document.body.style.overflow = '';
  };

  // Agendar modal helper functions
  const handleOpenAgendar = () => {
    setAgNombre('');
    setAgCorreo('');
    setAgTel('');
    setAgMedio('llamada');
    setAgDateSelected(null);
    setAgHoraSelected('');
    setAgErr('');
    setAgDoneTxt('');
    setAgSubmitting(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCalViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

    setAgendarOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseAgendar = () => {
    setAgendarOpen(false);
    document.body.style.overflow = '';
  };

  // Calculate available hours for selected date
  const getSlotsForDate = (date: Date) => {
    const d = date.getDay();
    if (d === 0) return []; // Sunday closed
    const end = d === 6 ? 14 : 18; // Saturday until 14:00, weekdays until 18:00
    const out: string[] = [];
    for (let h = 8; h < end; h++) {
      out.push(`${String(h).padStart(2, '0')}:00`);
      out.push(`${String(h).padStart(2, '0')}:30`);
    }
    return out;
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0;
  };

  const handleSelectDate = (date: Date) => {
    setAgDateSelected(date);
    const slots = getSlotsForDate(date);
    setAgHoraSelected(slots.length > 0 ? slots[0] : '');
  };

  // Submit appointment to Supabase via POST /api/agendar
  const handleSubmitAgendar = async () => {
    setAgErr('');

    if (!agNombre.trim()) {
      setAgErr('Escribe tu nombre.');
      return;
    }
    if (!agDateSelected) {
      setAgErr('Elige una fecha disponible.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(agCorreo)) {
      setAgErr('Revisa tu correo.');
      return;
    }
    if (agTel.replace(/\D/g, '').length < 7) {
      setAgErr('Revisa tu número de contacto.');
      return;
    }

    setAgSubmitting(true);

    try {
      const year = agDateSelected.getFullYear();
      const month = String(agDateSelected.getMonth() + 1).padStart(2, '0');
      const day = String(agDateSelected.getDate()).padStart(2, '0');
      const formattedDateStr = `${year}-${month}-${day}`;

      // Disparar agendamiento y checkout en paralelo
      const agendarPromise = fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: agNombre,
          correo: agCorreo,
          celular: agTel,
          fecha: formattedDateStr,
          hora: agHoraSelected || '08:00',
          medio_contacto: agMedio,
        }),
      }).catch((err) => console.warn('[Landing] Error en agendar:', err));

      const checkoutPromise = fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: agNombre,
          customer_email: agCorreo,
          customer_phone: agTel,
        }),
      });

      const [, checkoutRes] = await Promise.all([agendarPromise, checkoutPromise]);

      if (checkoutRes && checkoutRes.ok) {
        const dataCheckout = await checkoutRes.json();
        if (dataCheckout.checkoutUrl) {
          window.location.href = dataCheckout.checkoutUrl;
          return;
        }
      }

      const f = agDateSelected;
      const fechaTexto = `${f.getDate()} de ${MESES_NOMBRES[f.getMonth()]} de ${f.getFullYear()}`;
      const horaTexto = agHoraSelected ? ` a las ${agHoraSelected}` : '';
      setAgDoneTxt(
        `Gracias, ${agNombre.trim().split(' ')[0]}. Cita registrada. Redirigiendo al pago...`
      );
    } catch (err) {
      console.error('Error enviando cita:', err);
      setAgErr('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setAgSubmitting(false);
    }
  };

  // Date Finder input change handler
  const handleCedInput = (val: string) => {
    const v = val.replace(/\D/g, '').slice(0, 2);
    setCedInput(v);
    if (v.length === 2) {
      setFinderResult({ html: resolveCedula(v), hasResult: true });
    } else if (v.length === 1) {
      setFinderResult({ html: '<p class="finder__hint">Falta un dígito.</p>', hasResult: false });
    } else {
      setFinderResult({ html: '<p class="finder__hint">Escríbelos y te digo tu fecha.</p>', hasResult: false });
    }
  };

  const resolveCedula = (raw: string) => {
    let n = parseInt(raw, 10);
    if (n === 0) n = 100;
    const [dia, mes] = FECHAS[Math.ceil(n / 2) - 1].split(' ');
    const [idx, nombre] = MES_MAP[mes];
    const fecha = new Date(2026, idx, +dia);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
    const meta =
      dias > 0
        ? `Faltan ${dias} días. Declaración y pago el mismo día.`
        : 'Fecha ya vencida. Consulta con el equipo.';
    return `<div><p class="finder__cap">Tu fecha límite</p>
            <p class="finder__date">${+dia} de ${nombre}, 2026</p>
            <p class="finder__meta">${meta}</p></div>`;
  };

  // Main Effect: Canvas stars, scroll choreography, observers
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

    // 1. Stars Canvas
    const cv = root.querySelector('#stars') as HTMLCanvasElement | null;
    let starsRaf: number | null = null;
    let starsCleanup: (() => void) | null = null;

    if (cv) {
      const ctx = cv.getContext('2d');
      if (ctx) {
        let stars: Array<{ x: number; y: number; r: number; a: number; s: number; t: number }> = [];
        let w = 0, h = 0, dpr = 1;

        const buildStars = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          w = window.innerWidth;
          h = window.innerHeight;
          cv.width = w * dpr;
          cv.height = h * dpr;
          cv.style.width = w + 'px';
          cv.style.height = h + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const n = Math.round((w * h) / 12000);
          stars = Array.from({ length: Math.min(n, 260) }, () => ({
            x: Math.random() * w,
            y: Math.random() * h * 1.6 - h * 0.3,
            r: Math.random() < 0.88 ? Math.random() * 0.7 + 0.25 : Math.random() * 1.1 + 0.8,
            a: Math.random() * 0.45 + 0.08,
            s: Math.random() * 0.55 + 0.12,
            t: Math.random() * Math.PI * 2,
          }));
        };

        let yVal = 0;
        const drawStars = () => {
          ctx.clearRect(0, 0, w, h);
          const time = performance.now() / 2600;
          for (const st of stars) {
            let py = st.y - yVal * st.s * 0.16;
            py = (((py % (h * 1.6)) + h * 1.6) % (h * 1.6)) - h * 0.3;
            const tw = REDUCE ? 1 : 0.7 + 0.3 * Math.sin(time + st.t);
            ctx.globalAlpha = st.a * tw;
            ctx.fillStyle = st.r > 0.9 ? '#BFD4FF' : '#FFFFFF';
            ctx.beginPath();
            ctx.arc(st.x, py, st.r, 0, 6.283);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        };

        let isStarsVisible = true;
        const starsObserver = new IntersectionObserver(([entry]) => {
          isStarsVisible = entry.isIntersecting;
          if (isStarsVisible && !REDUCE) {
            if (!starsRaf) loopStars();
          } else {
            if (starsRaf) {
              cancelAnimationFrame(starsRaf);
              starsRaf = null;
            }
          }
        }, { threshold: 0.05 });
        starsObserver.observe(cv);

        const loopStars = () => {
          if (!isStarsVisible) {
            starsRaf = null;
            return;
          }
          drawStars();
          starsRaf = requestAnimationFrame(loopStars);
        };

        buildStars();
        if (REDUCE) {
          drawStars();
        } else {
          loopStars();
        }

        const handleResizeStars = () => buildStars();
        const handleScrollStars = () => {
          yVal = window.scrollY;
          if (REDUCE) drawStars();
        };

        window.addEventListener('resize', handleResizeStars, { passive: true });
        window.addEventListener('scroll', handleScrollStars, { passive: true });

        starsCleanup = () => {
          starsObserver.disconnect();
          if (starsRaf) cancelAnimationFrame(starsRaf);
          window.removeEventListener('resize', handleResizeStars);
          window.removeEventListener('scroll', handleScrollStars);
        };
      }
    }

    // 2. Text Split Choreography
    root.querySelectorAll('[data-split]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.getAttribute('data-split-done')) return;
      const tint = (htmlEl.dataset.tint || '')
        .split(',')
        .filter((s) => s !== '')
        .map(Number);
      const words = (htmlEl.textContent || '').trim().split(/\s+/);
      htmlEl.textContent = '';
      words.forEach((word, i) => {
        const outer = document.createElement('span');
        outer.className = 'w';
        const inner = document.createElement('span');
        inner.className = 'wi' + (tint.includes(i) ? ' tint' : '');
        inner.style.transitionDelay = Math.min(i * 0.045, 0.5) + 's';
        inner.textContent = word;
        outer.appendChild(inner);
        htmlEl.appendChild(outer);
        if (i < words.length - 1) htmlEl.appendChild(document.createTextNode(' '));
      });
      htmlEl.setAttribute('data-split-done', 'true');
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    root.querySelectorAll('[data-split],[data-reveal],.fade').forEach((el) => io.observe(el));

    // 3. Scroll Choreography Engine
    const ticks: Array<() => void> = [];
    const measures: Array<() => void> = [];
    let pending = false;
    let currentScrollY = window.scrollY;

    const onScroll = () => {
      currentScrollY = window.scrollY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        ticks.forEach((f) => f());
      });
    };

    const remeasure = () => {
      currentScrollY = window.scrollY;
      measures.forEach((f) => f());
      ticks.forEach((f) => f());
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer: NodeJS.Timeout;
    const handleResizeScroll = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(remeasure, 120);
    };
    window.addEventListener('resize', handleResizeScroll, { passive: true });

    // Header Navbar stuck state
    const nav = root.querySelector('#nav');
    if (nav) {
      ticks.push(() => nav.classList.toggle('stuck', currentScrollY > 24));
    }

    // Ticker Marquee
    const t = root.querySelector('#ticker') as HTMLElement | null;
    if (t && !t.getAttribute('data-duplicated')) {
      t.innerHTML += t.innerHTML;
      t.setAttribute('data-duplicated', 'true');
      let cachedHalf = 1;
      const measureTicker = () => {
        cachedHalf = Math.max(t.scrollWidth / 2, 1);
      };
      measures.push(measureTicker);
      measureTicker();

      ticks.push(() => {
        const x = -((currentScrollY * 0.28) % cachedHalf);
        t.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      });
    }

    // Horizontal Scroll Sections (#pasos and #topes)
    root.querySelectorAll('[data-h]').forEach((sec) => {
      const htmlSec = sec as HTMLElement;
      const track = htmlSec.querySelector('.htrack') as HTMLElement | null;
      const bar = htmlSec.querySelector('.hprogress i') as HTMLElement | null;
      if (!track) return;

      const rate = parseFloat(htmlSec.dataset.rate || '0.58');
      let top = 0,
        dist = 1,
        travel = 0;

      const measure = () => {
        const n = parseFloat(getComputedStyle(htmlSec).getPropertyValue('--n')) || 4;
        const vh = window.innerHeight;
        htmlSec.style.height = Math.round(n * vh * rate + vh * 0.42) + 'px';
        top = htmlSec.getBoundingClientRect().top + window.scrollY;
        dist = Math.max(htmlSec.offsetHeight - vh, 1);
        travel = Math.max(track.scrollWidth - window.innerWidth, 0);
      };

      const tick = () => {
        const p = clamp((currentScrollY - top) / dist, 0, 1);
        // Only transform if section is anywhere near viewport range
        if (p >= -0.2 && p <= 1.2) {
          track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
          if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
        }
      };

      measures.push(measure);
      ticks.push(tick);
      measure();
      tick();
    });

    // Archetype slots spring entry & dynamic glow effect
    const slots = Array.from(root.querySelectorAll('.card-slot')) as HTMLElement[];

    if (REDUCE) {
      slots.forEach((s) => s.classList.add('on'));
    } else {
      const cio = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('on');
              cio.unobserve(e.target);
            }
          });
        },
        { threshold: 0.62 }
      );
      slots.forEach((s) => cio.observe(s));
    }

    let slotMetrics: Array<{ slot: HTMLElement; top: number; height: number }> = [];
    const measureSlots = () => {
      slotMetrics = slots.map((s) => {
        const cardEl = (s.querySelector('.card') as HTMLElement) || s;
        const r = cardEl.getBoundingClientRect();
        return {
          slot: s,
          top: r.top + window.scrollY,
          height: r.height,
        };
      });
    };
    measures.push(measureSlots);

    ticks.push(() => {
      const vh = window.innerHeight;
      const mid = vh / 2;
      for (let i = 0; i < slotMetrics.length; i++) {
        const { slot: s, top: slotTop, height: slotHeight } = slotMetrics[i];
        const topInViewport = slotTop - currentScrollY;
        const bottomInViewport = topInViewport + slotHeight;

        if (bottomInViewport < -200 || topInViewport > vh + 200) {
          s.style.setProperty('--glow', '0');
          continue;
        }
        const cardCenter = topInViewport + slotHeight / 2;
        const d = Math.abs(cardCenter - mid) / vh;
        const g = Math.max(0, 1 - d * 2.2);
        s.style.setProperty('--glow', (g * g * 0.5).toFixed(3));
      }
    });

    remeasure();
    if (document.fonts) {
      document.fonts.ready.then(remeasure);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseCard();
        handleCloseAgendar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (starsCleanup) starsCleanup();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResizeScroll);
      window.removeEventListener('keydown', handleKeyDown);
      io.disconnect();
    };
  }, []);

  // Calendar Grid Renderer helper
  const renderCalendarDays = () => {
    const year = calViewDate.getFullYear();
    const month = calViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const leadEmptyDays = (firstDay.getDay() + 6) % 7; // Monday start
    const totalDays = new Date(year, month + 1, 0).getDate();

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < leadEmptyDays; i++) {
      elements.push(<div key={`empty-${i}`} className="cal__day empty" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const ok = isDateAvailable(date);
      const isSelected = agDateSelected && date.getTime() === agDateSelected.getTime();

      elements.push(
        <button
          key={`day-${d}`}
          type="button"
          disabled={!ok}
          className={`cal__day ${ok ? 'on' : 'off'} ${isSelected ? 'sel' : ''}`}
          onClick={() => ok && handleSelectDate(date)}
        >
          {d}
        </button>
      );
    }

    return elements;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canPrevMonth =
    calViewDate.getFullYear() > today.getFullYear() ||
    (calViewDate.getFullYear() === today.getFullYear() && calViewDate.getMonth() > today.getMonth());
  const limitDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const canNextMonth = calViewDate < limitDate;

  return (
    <div ref={rootRef}>
      <canvas id="stars" aria-hidden="true" />
      <div className="veil" aria-hidden="true" />

      {/* HEADER NAV */}
      <header className="nav" id="nav">
        <a href="#top" className="brand">
          STAKEHOLDERS<i />
        </a>
        <nav className="nav-links">
          <a href="#pasos">Cómo funciona</a>
          <a href="#arquetipos">Arquetipos</a>
          <a href="#topes">Topes</a>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="/"
            className="nav-back"
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em',
              textTransform: 'uppercase', color: 'var(--dim)', padding: '7px 4px',
            }}
          >
            ← Servicios
          </Link>
          <Link
            href="/admin/login"
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.2em',
              textTransform: 'uppercase', color: 'var(--dimmer)',
              padding: '7px 12px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.10)',
              transition: 'color .2s, border-color .2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--white)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.30)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--dimmer)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.10)'; }}
          >
            Login
          </Link>
          <button className="pill" onClick={handleOpenAgendar}>
            Agendar consulta
          </button>
        </div>
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section className="hero" data-reveal>
          <div className="hero-grid">
            <div>
              <h1 data-split>
                ¿Debes declarar renta este año?
              </h1>
              <p className="hero__sub fade">El primer paso es conocer hasta cuándo tienes tiempo de presentar la declaración</p>
            </div>

            <div className="hero__col">
              <div className={`finder fade ${finderResult.hasResult ? 'has-result' : ''}`} id="finder">
                <label className="finder__label" htmlFor="ced">
                  Conoce tu fecha límite de presentación de renta. Ingresa los dos últimos dígitos de tu cédula y te la decimos.
                </label>
                <div className="finder__row">
                  <input
                    className="finder__input"
                    id="ced"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={2}
                    placeholder="45"
                    value={cedInput}
                    onChange={(e) => handleCedInput(e.target.value)}
                    aria-describedby="out"
                  />
                  <div
                    className="finder__out"
                    id="out"
                    role="status"
                    aria-live="polite"
                    dangerouslySetInnerHTML={{ __html: finderResult.html }}
                  />
                </div>
                <div className="finder__foot">
                  <p>Cifras sujetas a validación de un contador del equipo</p>
                </div>
              </div>
              <div className="hero__cta fade" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/test" className="pill pill--blue">
                  Hacer el test →
                </Link>
                <button className="pill pill--ghost" onClick={handleOpenAgendar}>
                  Agendar consulta
                </button>
              </div>
            </div>
          </div>
          <p className="scroll-cue">Desliza para empezar</p>
        </section>

        {/* TICKER MARQUEE */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker__in" id="ticker">
            <span>Patrimonio</span>
            <span><b>·</b></span>
            <span>Ingresos</span>
            <span><b>·</b></span>
            <span>Tarjeta de crédito</span>
            <span><b>·</b></span>
            <span>Consignaciones</span>
            <span><b>·</b></span>
            <span>Compras</span>
            <span><b>·</b></span>
            <span>Seis arquetipos</span>
            <span><b>·</b></span>
            <span>Un solo veredicto</span>
            <span><b>·</b></span>
          </div>
        </div>

        {/* CÓMO FUNCIONA */}
        <section className="hsec" id="pasos" data-h data-rate=".62" style={{ '--n': 5 } as React.CSSProperties}>
          <div className="hsec__sticky">
            <div className="hsec__head" data-reveal>
              <h2 data-split data-tint="1">
                Cómo funciona
              </h2>
              <p className="lead fade">
                Todos tenemos a ese amigo que factura como rey pero vive como nómada, o al que no le queda un peso porque el sueldo se le va apagando incendios. Estilos de vida opuestos, mismo destino: a los dos probablemente les toca declarar.
              </p>
            </div>
            <div className="hsec__body">
              <div className="htrack">
                <article className="step">
                  <p className="step__n">01</p>
                  <p>Entras y respondes un test corto sobre tu patrimonio, tus ingresos, tus créditos y tus movimientos.</p>
                </article>
                <article className="step">
                  <p className="step__n">02</p>
                  <p>El motor te compara con los cinco topes que la DIAN revisa cada año.</p>
                </article>
                <article className="step">
                  <p className="step__n">03</p>
                  <p>Descubres tu arquetipo: el personaje que mejor describe tu relación con el dinero.</p>
                </article>
                <article className="step">
                  <p className="step__n">04</p>
                  <p>Y el dato que de verdad importa: si te toca declarar, por qué tope, y hasta qué fecha tienes plazo.</p>
                </article>
                <article className="step step--cta">
                  <p className="step__n">Empieza</p>
                  <div>
                    <p style={{ marginBottom: 18 }}>
                      Responde el test, descubre tu arquetipo, y de paso descubre si este año te toca declarar renta con la fecha límite de presentar la declaración.
                    </p>
                    <a href="#arquetipos" className="pill">
                      Descubre tu arquetipo
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* ARQUETIPOS DECK */}
        <section className="arq" id="arquetipos">
          <div className="arq__wrap">
            <div className="arq__head" data-reveal>
              <h2 data-split data-tint="1,2">
                Los seis arquetipos
              </h2>
              <p className="lead fade">Seis arquetipos diferentes para seis perfiles tributarios diferentes.</p>
            </div>
            <div className="arq__deck" id="deck">
              {ARCHETYPES.map((a, i) => (
                <div
                  key={a.n}
                  className="card-slot"
                  style={{
                    '--hA': a.hA,
                    '--hB': a.hB,
                    '--accent': a.accent,
                    '--c2': a.c2,
                  } as React.CSSProperties}
                >
                  <div className="splash" aria-hidden="true" />
                  <div className="card" data-i={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.img.startsWith('/') ? a.img : ASSET_BASE + a.img}
                      alt={`Carta de ${a.n}`}
                      loading={i < 3 ? "eager" : "lazy"}
                      decoding="async"
                    />
                    <button
                      type="button"
                      className="card__hit"
                      onClick={() => handleOpenCard(i)}
                      aria-label={`Conocer más sobre ${a.n}`}
                    />
                    <span className="card__more">Clic para conocer más</span>
                    <span className="card__name">{a.n}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TOPES */}
        <section className="hsec" id="topes" data-h data-rate=".55" style={{ '--n': 6 } as React.CSSProperties}>
          <div className="hsec__sticky">
            <div className="hsec__head" data-reveal>
              <h2 data-split data-tint="1,2">
                Quiénes deben declarar
              </h2>
              <p className="lead fade">
                No importa el arquetipo que seas: basta con tropezar en uno de estos cinco topes para que la DIAN te ponga la mano en el hombro.
              </p>
            </div>
            <div className="hsec__body">
              <div className="htrack">
                <article className="tope">
                  <p className="tope__i">Tope 01</p>
                  <p className="tope__c">Patrimonio bruto</p>
                  <p className="tope__m">$224.095.500</p>
                  <p className="tope__u">4.500 UVT</p>
                </article>
                <article className="tope">
                  <p className="tope__i">Tope 02</p>
                  <p className="tope__c">Ingresos brutos totales</p>
                  <p className="tope__m">$69.718.600</p>
                  <p className="tope__u">1.400 UVT</p>
                </article>
                <article className="tope">
                  <p className="tope__i">Tope 03</p>
                  <p className="tope__c">Consumos con tarjeta de crédito</p>
                  <p className="tope__m">$69.718.600</p>
                  <p className="tope__u">1.400 UVT</p>
                </article>
                <article className="tope">
                  <p className="tope__i">Tope 04</p>
                  <p className="tope__c">Consignaciones, depósitos o inversiones</p>
                  <p className="tope__m">$69.718.600</p>
                  <p className="tope__u">1.400 UVT</p>
                </article>
                <article className="tope">
                  <p className="tope__i">Tope 05</p>
                  <p className="tope__c">Compras y consumos</p>
                  <p className="tope__m">$69.718.600</p>
                  <p className="tope__u">1.400 UVT</p>
                </article>
                <article className="tope tope--cta">
                  <p className="tope__i">Y entonces</p>
                  <p className="tope__m" style={{ fontSize: 'clamp(1.9rem,7.4vw,3.4rem)', maxWidth: '15ch' }}>
                    ¿Cruzaste alguno, o no estás seguro?
                  </p>
                  <p>
                    <button className="pill" onClick={handleOpenAgendar} style={{ marginTop: 16 }}>
                      Agendar una consultoría
                    </button>
                  </p>
                </article>
              </div>
            </div>
            <div className="hprogress" aria-hidden="true">
              <i />
            </div>
          </div>
        </section>

        {/* OUTRO CIERRE */}
        <section className="outro" id="agendar" data-reveal>
          <h2 data-split data-tint="6,7">
            Al final del camino te espera la DIAN
          </h2>
          <div className="outro__actions fade">
            <Link href="/test" className="pill">
              Hacer el test →
            </Link>
            <a href="#finder" className="pill pill--ghost">
              Consultar mi fecha
            </a>
          </div>
          <p className="dian" aria-hidden="true">
            DIAN
          </p>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="foot">
        <p>Estimación orientativa. No es asesoría tributaria. Stakeholders 2026.</p>
        <nav>
          <a href="#top">Consultar</a>
          <button type="button" className="foot__link" onClick={handleOpenAgendar}>
            Agendar
          </button>
        </nav>
      </footer>

      {/* MODAL REVERSO DE CARTA */}
      <div
        className={`modal ${modalOpen ? 'open' : ''} ${modalPlaying ? 'playing' : ''} ${modalReversed ? 'reversed' : ''}`}
        id="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="m-title"
      >
        <div className="modal__bg" onClick={handleCloseCard} />
        {activeArchetype && (
          <div
            className="modal__card"
            id="m-card"
            style={{
              '--accent': activeArchetype.accent,
              '--c2': activeArchetype.c2,
            } as React.CSSProperties}
          >
            <button className="modal__close" onClick={handleCloseCard} aria-label="Cerrar">
              ✕
            </button>

            {/* STAGE 1: VIDEO PRESENTATION */}
            <div className="modal__stage" id="m-stage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id="m-poster" src={activeArchetype.img.startsWith('/') ? activeArchetype.img : ASSET_BASE + activeArchetype.img} alt="" />
              <video
                ref={videoRef}
                id="m-video"
                playsInline
                preload="auto"
                onPlaying={() => setModalPlaying(true)}
                onEnded={handleRevealInfo}
                onError={handleRevealInfo}
              />
              <div className="modal__load" id="m-load">
                <i aria-hidden="true" />
                <span className="modal__loadtxt">Cargando presentación</span>
                <button type="button" className="modal__skip" id="m-skip" onClick={handleRevealInfo}>
                  Ver info
                </button>
              </div>
            </div>

            {/* STAGE 2: INFO TEXT & BARS */}
            <div className="modal__info" id="m-info">
              <h3 id="m-title">{activeArchetype.n}</h3>
              <p className="modal__frase" id="m-frase">
                {activeArchetype.f}
              </p>
              <p
                className="modal__text"
                id="m-text"
                dangerouslySetInnerHTML={{ __html: activeArchetype.t }}
              />
              <div className="bars" id="m-bars">
                {Object.entries(activeArchetype.b).map(([k, v]) => (
                  <div key={k} className="bar">
                    <i>{k}</i>
                    <span>
                      <b style={{ '--v': v } as React.CSSProperties} />
                    </span>
                    <u>{Math.round(v * 100)}</u>
                  </div>
                ))}
              </div>
              <span className="verdict" id="m-verdict">
                {activeArchetype.v}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MODAL AGENDAR CONSULTA */}
      <div
        className={`sheet ${agendarOpen ? 'open' : ''}`}
        id="agendar-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ag-title"
      >
        <div className="sheet__bg" onClick={handleCloseAgendar} />
        <div className="sheet__card">
          <button className="sheet__close" onClick={handleCloseAgendar} aria-label="Cerrar">
            ✕
          </button>

          {!agDoneTxt ? (
            <div className="sheet__body" id="ag-form">
              <p className="sheet__eyebrow">Stakeholders</p>
              <h3 id="ag-title">Agendar consulta</h3>
              <p className="sheet__sub">Déjanos tus datos y elige un horario. Un contador del equipo confirma contigo.</p>

              <label className="fld">
                <span>Nombre completo</span>
                <input
                  id="ag-nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  value={agNombre}
                  onChange={(e) => setAgNombre(e.target.value)}
                />
              </label>

              <label className="fld">
                <span>Correo</span>
                <input
                  id="ag-correo"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={agCorreo}
                  onChange={(e) => setAgCorreo(e.target.value)}
                />
              </label>

              <label className="fld">
                <span>Número de contacto</span>
                <input
                  id="ag-tel"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="300 000 0000"
                  value={agTel}
                  onChange={(e) => setAgTel(e.target.value)}
                />
              </label>

              <label className="fld">
                <span>Método de contacto</span>
                <select
                  id="ag-medio"
                  value={agMedio}
                  onChange={(e) => setAgMedio(e.target.value as any)}
                >
                  <option value="llamada">Llamada</option>
                  <option value="videollamada">Reunión virtual</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>

              <div className="fld">
                <span>Fecha de la consulta</span>
                <div className="cal" id="ag-cal">
                  <div className="cal__nav">
                    <button
                      className="cal__arrow"
                      id="cal-prev"
                      aria-label="Mes anterior"
                      type="button"
                      disabled={!canPrevMonth}
                      onClick={() =>
                        setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1))
                      }
                    >
                      ‹
                    </button>
                    <p className="cal__month" id="cal-month">
                      {MESES_NOMBRES[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                    </p>
                    <button
                      className="cal__arrow"
                      id="cal-next"
                      aria-label="Mes siguiente"
                      type="button"
                      disabled={!canNextMonth}
                      onClick={() =>
                        setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1))
                      }
                    >
                      ›
                    </button>
                  </div>
                  <div className="cal__dow">
                    <span>L</span>
                    <span>M</span>
                    <span>M</span>
                    <span>J</span>
                    <span>V</span>
                    <span>S</span>
                    <span>D</span>
                  </div>
                  <div className="cal__grid" id="cal-grid">
                    {renderCalendarDays()}
                  </div>
                  <p className="cal__legend">Lun a vie 8:00–18:00 · Sáb 8:00–14:00 · Domingos cerrado</p>
                </div>
              </div>

              {agDateSelected && getSlotsForDate(agDateSelected).length > 0 && (
                <label className="fld" id="ag-hora-wrap">
                  <span>Hora</span>
                  <select
                    id="ag-hora"
                    value={agHoraSelected}
                    onChange={(e) => setAgHoraSelected(e.target.value)}
                  >
                    {getSlotsForDate(agDateSelected).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {agErr && (
                <p className="fld__err" id="ag-err">
                  {agErr}
                </p>
              )}

              <button
                className="pill pill--blue sheet__submit"
                id="ag-submit"
                type="button"
                disabled={agSubmitting}
                onClick={handleSubmitAgendar}
              >
                {agSubmitting ? 'Solicitando...' : 'Solicitar consulta'}
              </button>
            </div>
          ) : (
            <div className="sheet__done" id="ag-done">
              <div className="sheet__check" aria-hidden="true">
                ✓
              </div>
              <h3>Solicitud enviada</h3>
              <p className="sheet__sub" id="ag-done-txt">
                {agDoneTxt}
              </p>
              <button className="pill pill--ghost" onClick={handleCloseAgendar} type="button">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
