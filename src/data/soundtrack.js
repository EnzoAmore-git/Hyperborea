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
    label: 'Спокойствие',
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
    label: 'Тайна',
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
    label: 'Напряжение',
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
    label: 'Бой',
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
    label: 'Печаль',
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
    label: 'Тьма',
    root: 49, // G1 — ниже и тревожнее
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
    label: 'Свет',
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
const SCENES = {
  '1': [
    { from: 1, to: 1, mood: 'sacred', intensity: 0.15, label: 'Пролог' },
    { from: 2, to: 9, mood: 'sacred', intensity: 0.5, label: 'Чудо' },
    { from: 10, to: 13, mood: 'mystery', intensity: 0.4, label: 'Город' },
    { from: 14, to: 22, mood: 'mystery', intensity: 0.5, label: 'Подземелье' },
    { from: 23, to: 25, mood: 'tension', intensity: 0.55, label: 'Новая игра' },
  ],
  '2': [
    { from: 1, to: 1, mood: 'tension', intensity: 0.3, label: 'Перед штурмом' },
    { from: 2, to: 4, mood: 'tension', intensity: 0.45, label: 'Мёртвый дом' },
    { from: 5, to: 14, mood: 'battle', intensity: 0.85, label: 'Штурм' },
    { from: 15, to: 18, mood: 'battle', intensity: 0.7, label: 'Засада' },
    { from: 19, to: 26, mood: 'sorrow', intensity: 0.5, label: 'Ребёнок' },
    { from: 27, to: 32, mood: 'sorrow', intensity: 0.35, label: 'Тишина' },
    { from: 33, to: 40, mood: 'calm', intensity: 0.25, label: 'Разговор' },
  ],
  '3': [
    { from: 1, to: 1, mood: 'tension', intensity: 0.3, label: 'Старый храм' },
    { from: 2, to: 8, mood: 'tension', intensity: 0.45, label: 'Подготовка' },
    { from: 9, to: 29, mood: 'battle', intensity: 0.9, label: 'Храм' },
    { from: 30, to: 31, mood: 'mystery', intensity: 0.5, label: 'Книга' },
    { from: 32, to: 36, mood: 'sacred', intensity: 0.3, label: 'Икона' },
  ],
  '4': [
    { from: 1, to: 1, mood: 'mystery', intensity: 0.3, label: 'Расследование' },
    { from: 2, to: 6, mood: 'mystery', intensity: 0.45, label: 'Морг' },
    { from: 7, to: 9, mood: 'tension', intensity: 0.55, label: 'Генерал' },
    { from: 10, to: 13, mood: 'mystery', intensity: 0.55, label: 'Поиск' },
    { from: 14, to: 14, mood: 'tension', intensity: 0.65, label: 'Детский дом' },
  ],
  '5': [
    { from: 1, to: 1, mood: 'tension', intensity: 0.4, label: 'Подземный мир' },
    { from: 2, to: 5, mood: 'tension', intensity: 0.55, label: 'Спуск' },
    { from: 6, to: 12, mood: 'mystery', intensity: 0.55, label: 'Подземелье' },
    { from: 13, to: 15, mood: 'horror', intensity: 0.7, label: 'Пленник' },
    { from: 16, to: 16, mood: 'horror', intensity: 0.8, label: 'Заперты' },
  ],
  '6': [
    { from: 1, to: 1, mood: 'horror', intensity: 0.55, label: 'Одержимый' },
    { from: 2, to: 3, mood: 'horror', intensity: 0.8, label: 'Одержимый' },
    { from: 4, to: 6, mood: 'mystery', intensity: 0.55, label: 'Видение' },
    { from: 7, to: 7, mood: 'sacred', intensity: 0.45, label: 'Огонёк' },
    { from: 8, to: 9, mood: 'sacred', intensity: 0.35, label: 'Исцеление' },
    { from: 10, to: 10, mood: 'battle', intensity: 0.85, label: 'Прорыв' },
    { from: 11, to: 11, mood: 'battle', intensity: 0.9, label: 'Взрыв' },
  ],
  '7': [
    { from: 1, to: 1, mood: 'sorrow', intensity: 0.4, label: 'Доказательства' },
    { from: 2, to: 5, mood: 'calm', intensity: 0.3, label: 'Госпиталь' },
    { from: 6, to: 9, mood: 'tension', intensity: 0.55, label: 'Беловолосов' },
    { from: 10, to: 10, mood: 'calm', intensity: 0.3, label: 'Молитва' },
    { from: 11, to: 12, mood: 'tension', intensity: 0.75, label: 'Авария' },
  ],
  '8': [
    { from: 1, to: 1, mood: 'calm', intensity: 0.2, label: 'Интернат' },
    { from: 2, to: 6, mood: 'calm', intensity: 0.3, label: 'Дом' },
    { from: 7, to: 9, mood: 'sorrow', intensity: 0.5, label: 'Потери' },
    { from: 10, to: 12, mood: 'tension', intensity: 0.65, label: 'Роботы' },
    { from: 13, to: 16, mood: 'battle', intensity: 0.85, label: 'Интернат' },
    { from: 17, to: 19, mood: 'battle', intensity: 0.95, label: 'Видение' },
    { from: 20, to: 21, mood: 'horror', intensity: 0.75, label: 'Тьма' },
    { from: 22, to: 23, mood: 'sorrow', intensity: 0.6, label: 'Пепел' },
  ],
  '9': [
    { from: 1, to: 1, mood: 'sorrow', intensity: 0.35, label: 'Дети' },
    { from: 2, to: 3, mood: 'sorrow', intensity: 0.55, label: 'Похороны' },
    { from: 4, to: 8, mood: 'tension', intensity: 0.5, label: 'Дети' },
    { from: 9, to: 15, mood: 'calm', intensity: 0.3, label: 'Сокол' },
  ],
  '10': [
    { from: 1, to: 1, mood: 'calm', intensity: 0.25, label: 'Палладиум' },
    { from: 2, to: 6, mood: 'calm', intensity: 0.35, label: 'Передышка' },
    { from: 7, to: 10, mood: 'tension', intensity: 0.5, label: 'Эфир' },
    { from: 11, to: 13, mood: 'tension', intensity: 0.6, label: 'Интервью' },
    { from: 14, to: 14, mood: 'tension', intensity: 0.45, label: 'Уход' },
  ],
};

const FALLBACK_CUE = {
  mood: 'mystery',
  intensity: 0.35,
  label: 'Тишина',
};

export const getMusicCue = (chapterId, pageNum) => {
  const id = String(chapterId ?? '');
  const page = Number(pageNum) || 1;
  const scenes = SCENES[id];
  const scene = scenes?.find((item) => page >= item.from && page <= item.to);
  const cue = scene ?? CHAPTER_DEFAULTS[id] ?? FALLBACK_CUE;
  const mood = MOODS[cue.mood] ? cue.mood : FALLBACK_CUE.mood;
  return {
    mood,
    moodLabel: MOODS[mood].label,
    intensity: Math.max(0, Math.min(1, Number(cue.intensity) || 0)),
    label: cue.label,
  };
};

export const MUSIC_STATES = Object.keys(MOODS);
