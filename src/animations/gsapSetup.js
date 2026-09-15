/**
 * Ленивая загрузка GSAP + ScrollTrigger (Этап 7.2, производительность).
 * gsap нужен только для scroll-эффектов (ревил/параллакс/скрытие navbar),
 * поэтому он не должен лежать в критическом пути первого экрана:
 * модуль подключается `import()` после первого кадра, а не через
 * статический импорт/`modulepreload`. Читалка (отдельный чанк) тоже
 * грузит gsap через этот лоадер.
 */
let modPromise = null;

export function loadGSAP() {
  if (!modPromise) {
    modPromise = Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    });
  }
  return modPromise;
}