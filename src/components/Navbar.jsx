import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DURATION, EASING, prefersReducedMotion } from '../animations/timing.js';
import { getLenis } from '../animations/lenis.js';
import { loadGSAP } from '../animations/gsapSetup.js';
import { useFocusTrap } from '../lib/focusTrap.js';

const LINKS = [
  { label: 'О проекте', href: '#about' },
  { label: 'Концепты', href: '#gallery' },
  { label: 'Команда', href: '#team' },
  { label: 'Поддержать', href: '#support' },
];

function RuneLogo() {
  return (
    <svg
      className="navbar__rune"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 2 L30 16 L16 30 L2 16 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16 7 L25 16 L16 25 L7 16 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M16 10 L22 16 L16 22 L10 16 Z" fill="currentColor" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navRef = useRef(null);
  const { pathname, hash } = useLocation();

  // Скрытие по направлению скролла (DoD 5.3): вниз — прячем, вверх — показываем
  useEffect(() => {
    if (!navRef.current || prefersReducedMotion()) return undefined;
    let cancelled = false;
    let cleanup = () => {};
    loadGSAP().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !navRef.current) return;
      const el = navRef.current;
      if (open) {
        gsap.set(el, { yPercent: 0 });
        return;
      }
      const st = ScrollTrigger.create({
        start: 96,
        end: 'max',
        onUpdate: (self) => {
          const hidden = self.direction === 1 && self.scroll() > 96;
          gsap.to(el, {
            yPercent: hidden ? -100 : 0,
            duration: DURATION.medium / 1000,
            ease: EASING.smooth,
            overwrite: 'auto',
          });
        },
      });
      cleanup = () => st.kill();
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open]);

  // Закрываем меню при смене маршрута (переход по ссылке)
  useEffect(() => {
    setOpen(false);
  }, [pathname, hash]);

  // Блокировка скролла фона + закрытие по Escape
  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Фокус в меню при открытии
  useEffect(() => {
    if (open) menuRef.current?.focus();
  }, [open]);

  // Фокус-ловушка + inert на контенте (DoD 6.1)
  useFocusTrap({
    active: open,
    rootRef: menuRef,
    inertSelectors: ['.site-main', '.site-footer'],
  });

  const smoothScrollTo = (href) => {
    if (!href.startsWith('#')) return;
    const lenis = getLenis();
    if (lenis && document.querySelector(href)) {
      lenis.scrollTo(href, { offset: -80, duration: 1.2 });
    }
  };

  const menuVariants = {
    hidden: { x: '100%' },
    visible: {
      x: 0,
      transition: { duration: DURATION.medium / 1000, ease: EASING.smooth },
    },
    exit: {
      x: '100%',
      transition: { duration: DURATION.medium / 1000, ease: EASING.enter },
    },
  };

  return (
    <header className="navbar" ref={navRef}>
      <nav className="navbar__inner container" aria-label="Основная навигация">
        <Link to="/" className="navbar__logo" aria-label="Гиперборея — на главную">
          <RuneLogo />
          <span>Гиперборея</span>
        </Link>

        <ul className="navbar__links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => { e.preventDefault(); smoothScrollTo(l.href); }}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`navbar__burger${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-controls="mob-menu"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mob-menu"
            ref={menuRef}
            className="mob-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
            tabIndex="-1"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ul className="mob-menu__list container">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: 32 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                      delay: 0.05 * (i + 1),
                      duration: DURATION.medium / 1000,
                      ease: EASING.smooth,
                    },
                  }}
                >
                  <a
                    href={l.href}
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      smoothScrollTo(l.href);
                    }}
                  >
                    <span className="mob-menu__num">0{i + 1}</span>
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}