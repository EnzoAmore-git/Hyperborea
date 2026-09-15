/**
 * Константы тайминга для JS (GSAP / Framer Motion).
 * ЕДИНСТВЕННЫЙ источник значений — src/styles/tokens.css (переменные --dur-*, --ease-*).
 * Здесь они продублированы в JS: изменяешь токен — меняй и этот файл.
 * Запрещено хардкодить длительности/кривые в компонентах и анимациях.
 */
export const DURATION = {
  fast: 120,
  medium: 320,
  slow: 600,
  extra: 900,
};

export const EASING = {
  /* cubic-bezier(0.22, 1, 0.36, 1) */
  smooth: [0.22, 1, 0.36, 1],
  /* cubic-bezier(0.34, 1.56, 0.64, 1) — упругий отскок */
  bounce: [0.34, 1.56, 0.64, 1],
  /* cubic-bezier(0.25, 0.8, 0.25, 1) */
  standard: [0.25, 0.8, 0.25, 1],
  /* cubic-bezier(0.11, 0, 0.5, 0) — вход, быстрое начало */
  enter: [0.11, 0, 0.5, 0],
};

export default { DURATION, EASING };