import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { getLenis } from '../animations/lenis.js';
import { DURATION, EASING } from '../animations/timing.js';
import { useSaveData } from '../hooks/useSaveData.js';

const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

export default function Hero() {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const saveData = useSaveData();
  const reduced = useReducedMotion();
  const videoRef = useRef(null);

  const playable = !videoFailed && !saveData && reduced !== true;

  useEffect(() => {
    if (!playable) return;
    // design.md (Performance): видео не грузим при старте — постер LCP,
    // а 2 МБ bg.mp4 качаются только после взаимодействия пользователя
    // (pointer/touch/wheel/scroll) ЛИБО длинного простоя (>20с).
    const el = videoRef.current;
    if (!el) return;
    let visible = false;
    let go = false;
    const start = () => {
      if (visible && go) setVideoActive(true);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      start();
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    const timer = setTimeout(() => { go = true; start(); }, 20000);
    const opts = { once: true, passive: true };
    const onUser = () => { go = true; start(); };
    addEventListener('pointerdown', onUser, opts);
    addEventListener('touchstart', onUser, opts);
    addEventListener('wheel', onUser, opts);
    addEventListener('scroll', onUser, opts);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      removeEventListener('pointerdown', onUser, opts);
      removeEventListener('touchstart', onUser, opts);
      removeEventListener('wheel', onUser, opts);
      removeEventListener('scroll', onUser, opts);
    };
  }, [playable]);

  const scrollToAbout = (e) => {
    e.preventDefault();
    const lenis = getLenis();
    if (lenis && document.querySelector('#about')) {
      lenis.scrollTo('#about', { offset: -80, duration: 1.2 });
    }
  };

  const fadeUp = (delay) => ({
    initial: { opacity: 0, y: 28 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.slow / 1000, ease: EASING.smooth, delay },
    },
  });

  const riseLite = (delay) => ({
    initial: { opacity: 1, y: 24 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.slow / 1000, ease: EASING.smooth, delay },
    },
  });

  return (
    <section className="hero" id="top">
      <div className="hero__bg" ref={videoRef} aria-hidden="true" data-hero-bg>
        {videoActive && playable ? (
          <video
            className="hero__video"
            src={asset('/video/bg.mp4')}
            poster={asset('/images/hero-poster.webp')}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <img
            className="hero__poster"
            src={asset('/images/hero-poster.webp')}
            alt=""
            fetchPriority="high"
          />
        )}
        <div className="hero__overlay" />
      </div>

      <div className="hero__content container" data-hero-content>
        <motion.p className="hero__eyebrow meta" {...fadeUp(0.1)}>
          Легенда о Северном Царстве · Веб-комикс · 18+
        </motion.p>
        <motion.h1 className="hero__title" {...riseLite(0.2)}>
          Гиперборея
        </motion.h1>
        <motion.p className="hero__lead" {...fadeUp(0.32)}>
          Недалёкое будущее: корпорации правят городами, а ночные улицы
          принадлежат оборотням. Луч Чистого Света изменил мир навсегда —
          и капитан Святослав, потомок богатырей, спускается вниз, чтобы
          найти тех, кто нажимает на спусковой крючок.
        </motion.p>
        <motion.div className="hero__actions" {...fadeUp(0.44)}>
          <Link to="/read/1/1" className="btn btn--primary">
            Читать книгу
          </Link>
          <a href="#about" className="btn btn--ghost" onClick={scrollToAbout}>
            О проекте
          </a>
        </motion.div>
      </div>
    </section>
  );
}