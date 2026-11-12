import { BOOK_CHAPTERS } from './book.js';
import { DEMO_CHAPTERS } from './demoChapters.js';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const chapterTitlePage = { type: 'chapter' };

const illustration = ({ slug, widths, ...page }) => {
  const url = (variant) => asset(`comics/demo/${slug}-${variant}.webp`);
  return {
    ...page,
    src: url(widths.at(-1)[0]),
    srcset: widths.map(([variant, width]) => `${url(variant)} ${width}w`).join(', '),
  };
};

const makeChapter = ({ id, subtitle, pages }) => ({
  id,
  title: `Глава ${id}`,
  subtitle,
  pages: [chapterTitlePage, ...pages].map((page, index) => ({ ...page, num: index + 1 })),
});

export const chapters = [
  ...DEMO_CHAPTERS.map(({ pages, ...chapter }) => makeChapter({
    ...chapter,
    pages: pages.map((page) => page.type === 'img' ? illustration(page) : page),
  })),
  ...BOOK_CHAPTERS.map(({ blocks, ...chapter }) => makeChapter({
    ...chapter,
    pages: blocks.map((paragraphs) => ({ type: 'text', paragraphs })),
  })),
];

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

/** Ссылки на следующие страницы (не более `count` штук; текстовые блоки пропускаются). */
export const getUpcomingUrls = (chapterId, pageNum, count = 2) => {
  const ch = getChapter(chapterId);
  if (!ch) return [];
  const urls = [];
  const start = Math.max(1, Number(pageNum) + 1);
  for (let i = start; i <= ch.pages.length && urls.length < count; i += 1) {
    const p = ch.pages[i - 1];
    if (p && p.src) urls.push(p.src);
  }
  if (urls.length < count) {
    const next = getNextChapter(chapterId);
    if (next && next.pages[0] && next.pages[0].src) urls.push(next.pages[0].src);
  }
  return urls.slice(0, count);
};