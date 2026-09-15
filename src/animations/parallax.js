/**
 * Параллакс и масштаб hero (Этап 5, DoD 5.2).
 * - `data-hero-bg`      — фон hero: scale 1 → 1.08 при скролле;
 * - `data-hero-content` — контент hero движется медленнее скролла (yPercent);
 * - `data-parallax="N"` — произвольный элемент, сдвиг ±N px по скроллу (scrub).
 * Только transform/opacity; при prefers-reduced-motion — выключено.
 */
import { getLenis } from './lenis.js';
import { loadGSAP } from './gsapSetup.js';
import { prefersReducedMotion } from './timing.js';

let lenisSynced = false;

function syncLenisToScrollTrigger(ScrollTrigger) {
  const lenis = getLenis();
  if (lenis && !lenisSynced) {
    lenisSynced = true;
    lenis.on('scroll', ScrollTrigger.update);
  }
}

export async function initParallax(root = document) {
  if (prefersReducedMotion()) return () => {};

  const { gsap, ScrollTrigger } = await loadGSAP();
  syncLenisToScrollTrigger(ScrollTrigger);

  const ctx = gsap.context(() => {
    const heroBg = root.querySelector('[data-hero-bg]');
    if (heroBg) {
      gsap.fromTo(
        heroBg,
        { scale: 1 },
        {
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: heroBg,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }

    const heroContent = root.querySelector('[data-hero-content]');
    if (heroContent) {
      gsap.fromTo(
        heroContent,
        { yPercent: 0 },
        {
          yPercent: -10,
          ease: 'none',
          scrollTrigger: {
            trigger: heroContent,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }

    gsap.utils.toArray('[data-parallax]', root).forEach((el) => {
      const speed = Math.abs(Number(el.dataset.parallax) || 12);
      gsap.fromTo(
        el,
        { y: speed },
        {
          y: -speed,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    });
  }, root);

  ScrollTrigger.refresh();

  return () => {
    ctx.revert();
  };
}