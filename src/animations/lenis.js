/**
 * Гладкий скролл Lenis + синхронизация с GSAP ScrollTrigger.
 * При prefers-reduced-motion: reduce Lenis НЕ инициализируется —
 * остаётся обычный нативный скролл (DoD 2.4).
 */
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenis = null;

export function initLenis() {
  if (lenis) return lenis;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  gsap.registerPlugin(ScrollTrigger);

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });

  // Синхронизация таймера Lenis с GSAP-тикером и ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroyLenis() {
  if (!lenis) return;
  lenis.destroy();
  lenis = null;
}

export function getLenis() {
  return lenis;
}