/**
 * Предзагрузка изображений страниц комикса (DoD 4.6).
 * При просмотре страницы N грузим N+1 и N+2. При Save-Data / prefers-reduced-data — отключается.
 */

/** Признак экономного трафика (Save-Data). */
export const isSaveData = () =>
  (typeof navigator !== 'undefined' && navigator.connection?.saveData) ||
  (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-data: reduce)').matches);

/**
 * Мягкая предзагрузка списка URL. Пропускается при Save-Data.
 * Загрузка через Image() не блокирует рендер и попадает в сеть с низким приоритетом.
 */
export function preloadImages(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;
  if (isSaveData()) return;
  urls.forEach((url) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  });
}

export default { preloadImages, isSaveData };