/**
 * Reveal-анимации секций через GSAP ScrollTrigger (Этап 5, DoD 5.1).
 * - `[data-reveal]`          — блок: autoAlpha 0→1, y 60→0 (once);
 * - `[data-reveal-group]`    — контейнер со stagger-детьми `[data-reveal-child]`;
 * - `[data-reveal="line"]`   — «live-линия»: scaleX 0→1 (реализация в CSS).
 * Один раз при входе во вьюпорт; при prefers-reduced-motion ничего не скрываем —
 * элементы остаются видимыми. Синхронизация смены позиции Lenis → ScrollTrigger.
 */
import { getLenis } from './lenis.js';
import { loadGSAP } from './gsapSetup.js';
import { DURATION, EASING, prefersReducedMotion } from './timing.js';

let lenisSynced = false;

function syncLenisToScrollTrigger(ScrollTrigger) {
  const lenis = getLenis();
  if (lenis && !lenisSynced) {
    lenisSynced = true;
    lenis.on('scroll', ScrollTrigger.update);
  }
}

export const revealSelectors = {
  block: '[data-reveal]:not([data-reveal="line"])',
  group: '[data-reveal-group]',
  child: '[data-reveal-child]',
  line: '[data-reveal="line"]',
};

export async function initScrollReveal(root = document) {
  if (prefersReducedMotion()) return () => {};

  const { gsap, ScrollTrigger } = await loadGSAP();
  syncLenisToScrollTrigger(ScrollTrigger);

  const blockDur = DURATION.slow / 1000;
  const childDur = DURATION.slow / 1000;

  const ctx = gsap.context(() => {
    gsap.utils.toArray(revealSelectors.block, root).forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 60 },
        {
          autoAlpha: 1,
          y: 0,
          duration: blockDur,
          ease: EASING.smooth,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        },
      );
    });

    gsap.utils.toArray(revealSelectors.group, root).forEach((group) => {
      const children = group.querySelectorAll(revealSelectors.child);
      if (!children.length) return;
      gsap.fromTo(
        children,
        { autoAlpha: 0, y: 48 },
        {
          autoAlpha: 1,
          y: 0,
          duration: childDur,
          ease: EASING.smooth,
          stagger: 0.12,
          scrollTrigger: { trigger: group, start: 'top 85%', once: true },
        },
      );
    });

    gsap.utils.toArray(revealSelectors.line, root).forEach((line) => {
      gsap.fromTo(
        line,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: DURATION.extra / 1000,
          ease: EASING.smooth,
          scrollTrigger: { trigger: line, start: 'top 92%', once: true },
        },
      );
    });
  }, root);

  ScrollTrigger.refresh();

  return () => {
    ctx.revert();
  };
}