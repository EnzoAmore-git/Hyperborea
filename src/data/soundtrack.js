import { SCENES, PARAGRAPH_CUES } from './soundtrackScenes.js';
export { SCENES, PARAGRAPH_CUES };

/**
 * Музыкальная карта книги.
 *
 * Каждая глава разбита на сцены по номерам страниц читалки. Сцена задаёт
 * настроение и интенсивность (0…1). Движок саундтрека плавно переходит
 * между состояниями и использует интенсивность для плотности/громкости слоёв.
 *
 * Если для главы/страницы нет точной сцены, берётся CHAPTER_DEFAULTS.
 */

export const MOODS = {
  calm: {
    label: 'Покой и близость',
    root: 55, // A1 — общая тональная опора книги
    chord: [0, 3, 7, 10],
    scale: [0, 2, 3, 7, 10],
    filter: 900,
    drone: 0.22,
    pad: 0.17,
    noise: 0.07,
    bell: 0.1,
    drums: 'none',
  },
  mystery: {
    label: 'Тайна и поиск',
    root: 55,
    chord: [0, 1, 7, 8],
    scale: [0, 1, 3, 6, 7],
    filter: 620,
    drone: 0.28,
    pad: 0.12,
    noise: 0.15,
    bell: 0.08,
    drums: 'pulse',
  },
  tension: {
    label: 'Тревога и ожидание',
    root: 55,
    chord: [0, 3, 6, 10],
    scale: [0, 2, 3, 6, 7],
    filter: 1250,
    drone: 0.3,
    pad: 0.17,
    noise: 0.11,
    bell: 0.06,
    drums: 'heart',
  },
  battle: {
    label: 'Бой и прорыв',
    root: 55,
    chord: [0, 3, 7, 10],
    scale: [0, 3, 5, 7, 10],
    filter: 2100,
    drone: 0.34,
    pad: 0.19,
    noise: 0.09,
    bell: 0.04,
    drums: 'battle',
  },
  sorrow: {
    label: 'Скорбь и утрата',
    root: 55,
    chord: [0, 3, 7, 10],
    scale: [0, 2, 3, 7, 8],
    filter: 720,
    drone: 0.24,
    pad: 0.2,
    noise: 0.07,
    bell: 0.13,
    drums: 'none',
  },
  horror: {
    label: 'Ужас и Тьма',
    root: 55, // A1 — общая опора, напряжение создают интервалы
    chord: [0, 1, 6, 7],
    scale: [0, 1, 3, 6, 8],
    filter: 500,
    drone: 0.34,
    pad: 0.1,
    noise: 0.19,
    bell: 0.05,
    drums: 'ritual',
  },
  sacred: {
    label: 'Свет и надежда',
    root: 55,
    chord: [0, 4, 7, 11],
    scale: [0, 2, 4, 7, 9],
    filter: 1500,
    drone: 0.2,
    pad: 0.22,
    noise: 0.06,
    bell: 0.17,
    drums: 'none',
  },
};

const CHAPTER_DEFAULTS = {
  '1': { mood: 'mystery', intensity: 0.35, label: 'Знамение' },
  '2': { mood: 'tension', intensity: 0.4, label: 'Перед штурмом' },
  '3': { mood: 'tension', intensity: 0.4, label: 'Старый храм' },
  '4': { mood: 'mystery', intensity: 0.4, label: 'Расследование' },
  '5': { mood: 'tension', intensity: 0.5, label: 'Подземный мир' },
  '6': { mood: 'horror', intensity: 0.6, label: 'Одержимый' },
  '7': { mood: 'sorrow', intensity: 0.4, label: 'Доказательства' },
  '8': { mood: 'tension', intensity: 0.5, label: 'Интернат' },
  '9': { mood: 'sorrow', intensity: 0.4, label: 'Дети' },
  '10': { mood: 'calm', intensity: 0.3, label: 'Палладиум' },
};

/**
 * Границы сцен указаны по номерам страниц читалки (включительно).
 * Одна страница может содержать несколько абзацев — музыка держится
 * на уровне сцены, а не дёргается на каждом абзаце.
 */
const FALLBACK_CUE = {
  mood: 'mystery',
  intensity: 0.35,
  label: 'Тишина',
};

export const getMusicCue = (chapterId, pageNum, paragraphNum = 1) => {
  const id = String(chapterId ?? '');
  const page = Math.max(1, Number(pageNum) || 1);
  const paragraph = Math.max(1, Number(paragraphNum) || 1);
  const scenes = SCENES[id] ?? [];
  const scene = scenes.find((item) => page >= item.from && page <= item.to);
  const override = PARAGRAPH_CUES.find((item) => item.chapter === id
    && item.page === page && paragraph >= item.fromParagraph && paragraph <= item.toParagraph);
  const cue = override ?? scene ?? CHAPTER_DEFAULTS[id] ?? FALLBACK_CUE;
  const mood = MOODS[cue.mood] ? cue.mood : FALLBACK_CUE.mood;
  const upcoming = [
    ...PARAGRAPH_CUES.filter((item) => item.chapter === id && item.page === page
      && item.fromParagraph > paragraph).map((item) => ({ ...item, order: page * 10000 + item.fromParagraph })),
    ...scenes.filter((item) => item.from > page).map((item) => {
      const first = PARAGRAPH_CUES.find((x) => x.chapter === id && x.page === item.from && x.fromParagraph === 1);
      return { ...(first ?? item), order: item.from * 10000 };
    }),
    ...PARAGRAPH_CUES.filter((item) => item.chapter === id && item.page > page)
      .map((item) => ({ ...item, order: item.page * 10000 + item.fromParagraph })),
  ].sort((a, b) => a.order - b.order);
  const nextMood = upcoming.find((item) => item.mood !== mood)?.mood
    ?? SCENES[String(Number(id) + 1)]?.[0]?.mood;
  return {
    mood,
    moodLabel: MOODS[mood].label,
    intensity: Math.max(0, Math.min(1, Number(cue.intensity) || 0)),
    label: cue.label,
    urgent: Boolean(cue.urgent),
    nextMood,
  };
};

export const MUSIC_STATES = Object.keys(MOODS);
