/**
 * Данные комикса «Легенда о Северном Царстве. Часть 1. Гиперборея».
 * Структура: глава → страницы → пути к изображениям (public/pages/chapter-N/page-M).
 * Имена глав — из источников sources/Hyperborea Demo.txt.
 */

// Пути с префиксом базового пути (локально '/', на GH Pages '/Hyperborea/')
const asset = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

const pad = (n) => String(n).padStart(2, '0');

const RAW_CHAPTERS = [
  { id: '1', title: 'Глава 1', subtitle: 'Пролог: Луч Чистого Света', pageCount: 10, ext: 'jpg' },
  { id: '2', title: 'Глава 2', subtitle: 'Мутанты', pageCount: 5, ext: 'png' },
  { id: '3', title: 'Глава 3', subtitle: 'Старый храм', pageCount: 5, ext: 'png' },
];

/** Список глав с готовыми путями страниц. */
export const chapters = RAW_CHAPTERS.map((ch) => ({
  ...ch,
  pages: Array.from({ length: ch.pageCount }, (_, i) => {
    const num = i + 1;
    // Исключение: в главе 3 страница 5 лежит как jpg
    const ext = ch.id === '3' && num === 5 ? 'jpg' : ch.ext;
    const dir = `/pages/chapter-${ch.id}`;
    const stem = `page-${pad(num)}`;
    const webp = (w) => asset(`${dir}/webp/${stem}-${w}.webp`);
    return {
      num,
      // Основная — WebP-производная 1600px (Этап 6.2); fallback — оригинал
      src: webp(1600),
      srcset: `${webp(800)} 800w, ${webp(1200)} 1200w, ${webp(1600)} 1600w`,
      fallback: asset(`${dir}/${stem}.${ext}`),
      lqip: webp(40),
    };
  }),
}));

export const getChapter = (id) => chapters.find((c) => c.id === String(id)) ?? null;

const chapterIndex = (id) => chapters.findIndex((c) => c.id === String(id));

export const getNextChapter = (id) => {
  const i = chapterIndex(id);
  return i >= 0 && i < chapters.length - 1 ? chapters[i + 1] : null;
};

export const getPrevChapter = (id) => {
  const i = chapterIndex(id);
  return i > 0 ? chapters[i - 1] : null;
};

/** Страница по id главы и номеру (1-based). null — если нет такой страницы. */
export const getPage = (chapterId, pageNum) => {
  const ch = getChapter(chapterId);
  if (!ch) return null;
  const num = Number(pageNum);
  if (!Number.isInteger(num)) return null;
  return ch.pages[num - 1] ?? null;
};

/** Ссылки на следующие страницы (не более `count` штук, включая первую страницу следующей главы). */
export const getUpcomingUrls = (chapterId, pageNum, count = 2) => {
  const ch = getChapter(chapterId);
  if (!ch) return [];
  const urls = [];
  const start = Math.max(1, Number(pageNum) + 1);
  for (let i = start; i <= ch.pages.length && urls.length < count; i += 1) {
    urls.push(ch.pages[i - 1].src);
  }
  if (urls.length < count) {
    const next = getNextChapter(chapterId);
    if (next) urls.push(next.pages[0].src);
  }
  return urls.slice(0, count);
};