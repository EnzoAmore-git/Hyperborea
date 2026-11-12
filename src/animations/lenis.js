/**
 * Гладкий скролл Lenis (DoD 2.4).
 * При prefers-reduced-motion: reduce Lenis НЕ инициализируется —
 * остаётся обычный нативный скролл.
 * Синхронизация с GSAP ScrollTrigger происходит в этапе 5
 * (scrollReveal/parallax), там же подключается gsap — чтобы держать
 * gsap вне главного чанка.
 * Этап 7.2: сам Lenis тоже подключается динамически (`import()`) —
 * не лежит критическим путём, не попадает в modulepreload первого экрана.
 */
let lenis = null;
let lenisPromise = null;

export function initLenis() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }
  if (!lenisPromise) {
    lenisPromise = import('@studio-freight/lenis').then(({ default: Lenis }) => {
      if (lenis) return lenis;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.4,
      });

      // RAF-цикл через requestAnimationFrame (без gsap.ticker).
      // StrictMode в dev монтирует/размонтирует App — защищаемся от null после destroy.
      const raf = (time) => {
        if (lenis) lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      return lenis;
    });
  }
  return lenisPromise;
}

export function destroyLenis() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
  lenisPromise = null;
}

export function getLenis() {
  return lenis;
}